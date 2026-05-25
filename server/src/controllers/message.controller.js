import Conversation from '../models/Conversation.js';
import Friend from '../models/Friend.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO, getReceiverSocketId } from '../socket.js';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const buildHHMMTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const sendMessage = async (req, res) => {
    try {
        const senderId = getAuthUserId(req);
        const { receiverId, conversationId, content } = req.body;

        if (!senderId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (!content || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: 'content is required',
            });
        }

        if (!receiverId && !conversationId) {
            return res.status(400).json({
                success: false,
                message: 'receiverId or conversationId is required',
            });
        }

        let conversation;
        let targetReceiverId = receiverId;
        let isPending = false;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found',
                });
            }

            const isParticipant =
                String(conversation.user1) === String(senderId) ||
                String(conversation.user2) === String(senderId);

            if (!isParticipant) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not part of this conversation',
                });
            }

            // Nếu conversation đang pending, chỉ initiator (người gửi ban đầu) được nhắn thêm
            if (conversation.status === 'pending') {
                if (String(conversation.initiator) !== String(senderId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Message request has not been accepted yet',
                    });
                }
                isPending = true;
            }

            targetReceiverId =
                String(conversation.user1) === String(senderId)
                    ? String(conversation.user2)
                    : String(conversation.user1);
        } else {
            if (String(senderId) === String(receiverId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot send message to yourself',
                });
            }

            const receiver = await User.findById(receiverId).select('_id');
            if (!receiver) {
                return res.status(404).json({
                    success: false,
                    message: 'Receiver not found',
                });
            }

            const isFriend = await Friend.exists({
                $or: [
                    { user1: senderId, user2: receiverId },
                    { user1: receiverId, user2: senderId },
                ],
            });

            // Tìm hoặc tạo conversation
            conversation = await Conversation.findOne({
                $or: [
                    { user1: senderId, user2: receiverId },
                    { user1: receiverId, user2: senderId },
                ],
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    user1: senderId,
                    user2: receiverId,
                    status: isFriend ? 'accepted' : 'pending',
                    initiator: isFriend ? null : senderId,
                });
                isPending = !isFriend;
            } else {
                // Nếu conversation pending mà người nhận cố gửi lại → từ chối
                if (
                    conversation.status === 'pending' &&
                    String(conversation.initiator) !== String(senderId)
                ) {
                    return res.status(403).json({
                        success: false,
                        message: 'Message request has not been accepted yet',
                    });
                }
                isPending = conversation.status === 'pending';
            }
        }

        const now = new Date();
        const message = await Message.create({
            sender: senderId,
            conversation: conversation._id,
            content: String(content).trim(),
            sendDate: now,
            sendTime: buildHHMMTime(now),
            seenStatus: false,
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email avatarURL')
            .populate('conversation', 'user1 user2 status initiator');

        // Socket: emit khác nhau tùy theo pending hay accepted
        const receiverSocketId = getReceiverSocketId(String(targetReceiverId));
        if (receiverSocketId) {
            const eventName = isPending ? 'message_request' : 'receive_message';
            getIO().to(receiverSocketId).emit(eventName, {
                message: populatedMessage,
                receiverId: targetReceiverId,
                conversationStatus: conversation.status,
                conversationId: conversation._id,
            });
        }

        return res.status(201).json({
            success: true,
            data: {
                message: populatedMessage,
                receiverId: targetReceiverId,
                conversationStatus: conversation.status,
                conversationId: conversation._id,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};