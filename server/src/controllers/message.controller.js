import Conversation from '../models/Conversation.js';
import Friend from '../models/Friend.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO, getReceiverSocketId, emitToMembers } from '../socket.js';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const buildHHMMTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// POST /messages — gửi tin nhắn (hỗ trợ cả direct và group)
export const sendMessage = async (req, res) => {
    try {
        const senderId = getAuthUserId(req);
        const { receiverId, conversationId, content } = req.body;

        if (!senderId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!content || !String(content).trim()) {
            return res.status(400).json({ success: false, message: 'content is required' });
        }

        if (!receiverId && !conversationId) {
            return res.status(400).json({ success: false, message: 'receiverId or conversationId is required' });
        }

        let conversation;
        let targetReceiverId = receiverId;
        let isPending = false;
        let isGroup = false;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }

            if (conversation.type === 'group') {
                // Group chat: kiểm tra membership
                const isMember = conversation.members.some(
                    (m) => String(m) === String(senderId)
                );
                if (!isMember) {
                    return res.status(403).json({ success: false, message: 'You are not part of this group' });
                }
                isGroup = true;
            } else {
                // Direct chat
                const isParticipant =
                    String(conversation.user1) === String(senderId) ||
                    String(conversation.user2) === String(senderId);
                if (!isParticipant) {
                    return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
                }

                if (conversation.status === 'pending') {
                    if (String(conversation.initiator) !== String(senderId)) {
                        return res.status(403).json({ success: false, message: 'Message request has not been accepted yet' });
                    }
                    isPending = true;
                }

                targetReceiverId =
                    String(conversation.user1) === String(senderId)
                        ? String(conversation.user2)
                        : String(conversation.user1);
            }
        } else {
            // Direct chat bằng receiverId
            if (String(senderId) === String(receiverId)) {
                return res.status(400).json({ success: false, message: 'Cannot send message to yourself' });
            }

            const receiver = await User.findById(receiverId).select('_id');
            if (!receiver) {
                return res.status(404).json({ success: false, message: 'Receiver not found' });
            }

            const isFriend = await Friend.exists({
                $or: [
                    { user1: senderId, user2: receiverId },
                    { user1: receiverId, user2: senderId },
                ],
            });

            conversation = await Conversation.findOne({
                type: 'direct',
                $or: [
                    { user1: senderId, user2: receiverId },
                    { user1: receiverId, user2: senderId },
                ],
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    type: 'direct',
                    user1: senderId,
                    user2: receiverId,
                    status: isFriend ? 'accepted' : 'pending',
                    initiator: isFriend ? null : senderId,
                });
                isPending = !isFriend;
            } else {
                if (conversation.status === 'pending' && String(conversation.initiator) !== String(senderId)) {
                    return res.status(403).json({ success: false, message: 'Message request has not been accepted yet' });
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
            readBy: isGroup ? [senderId] : [],
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email avatarURL role')
            .populate('conversation', 'user1 user2 status initiator type members');

        // Update conversation updatedAt
        await Conversation.findByIdAndUpdate(conversation._id, { updatedAt: now });

        // ── Socket emit ───────────────────────────────────────────────────────
        if (isGroup) {
            // Emit đến tất cả thành viên trừ người gửi
            emitToMembers(
                conversation.members,
                'receive_message',
                {
                    message: populatedMessage,
                    conversationId: conversation._id,
                    conversationType: 'group',
                },
                senderId
            );
        } else {
            const receiverSocketId = getReceiverSocketId(String(targetReceiverId));
            if (receiverSocketId) {
                const eventName = isPending ? 'message_request' : 'receive_message';
                getIO().to(receiverSocketId).emit(eventName, {
                    message: populatedMessage,
                    receiverId: targetReceiverId,
                    conversationStatus: conversation.status,
                    conversationId: conversation._id,
                    conversationType: 'direct',
                });
            }
        }

        return res.status(201).json({
            success: true,
            data: {
                message: populatedMessage,
                receiverId: targetReceiverId,
                conversationStatus: isGroup ? 'accepted' : conversation.status,
                conversationId: conversation._id,
                conversationType: isGroup ? 'group' : 'direct',
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /messages/:id/pin — ghim/bỏ ghim tin nhắn
export const pinMessage = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        if (message.isRecalled) return res.status(400).json({ success: false, message: 'Cannot pin a recalled message' });

        // Kiểm tra user có trong conversation không
        const conversation = await Conversation.findById(message.conversation);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const isMember =
            conversation.type === 'group'
                ? conversation.members.some((m) => String(m) === String(userId))
                : String(conversation.user1) === String(userId) || String(conversation.user2) === String(userId);

        if (!isMember) return res.status(403).json({ success: false, message: 'Forbidden' });

        // Toggle pin
        const willPin = !message.isPinned;
        message.isPinned = willPin;
        message.pinnedBy = willPin ? userId : null;
        message.pinnedAt = willPin ? new Date() : null;
        await message.save();

        const populated = await Message.findById(id)
            .populate('sender', 'name email avatarURL role')
            .populate('pinnedBy', 'name email avatarURL');

        // Notify other members
        const eventName = willPin ? 'message_pinned' : 'message_unpinned';
        if (conversation.type === 'group') {
            emitToMembers(conversation.members, eventName, { message: populated, conversationId: conversation._id }, userId);
        } else {
            const otherId = String(conversation.user1) === String(userId)
                ? String(conversation.user2)
                : String(conversation.user1);
            const socketId = getReceiverSocketId(otherId);
            if (socketId) getIO().to(socketId).emit(eventName, { message: populated, conversationId: conversation._id });
        }

        return res.status(200).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /messages/:id/recall — thu hồi tin nhắn
export const recallMessage = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

        const conversation = await Conversation.findById(message.conversation);

        // Cho phép người gửi, group admin, hoặc system admin thu hồi tin nhắn
        let isSystemAdmin = false;
        try {
            const reqUser = await User.findById(userId);
            isSystemAdmin = reqUser?.role === 'admin' || reqUser?.email === 'admin@jvconnect.com';
        } catch (_) {}

        const isSender = String(message.sender) === String(userId);
        const isGroupAdmin = conversation?.type === 'group' && String(conversation.admin) === String(userId);

        if (!isSender && !isGroupAdmin && !isSystemAdmin) {
            return res.status(403).json({ success: false, message: 'You can only recall your own messages' });
        }

        if (message.isRecalled) {
            return res.status(400).json({ success: false, message: 'Message already recalled' });
        }

        message.isRecalled = true;
        message.isPinned = false; // Bỏ ghim nếu đang ghim
        await message.save();

        // Notify other members
        const payload = { messageId: id, conversationId: message.conversation };
        if (conversation?.type === 'group') {
            emitToMembers(conversation.members, 'message_recalled', payload, userId);
        } else if (conversation) {
            const otherId = String(conversation.user1) === String(userId)
                ? String(conversation.user2)
                : String(conversation.user1);
            const socketId = getReceiverSocketId(otherId);
            if (socketId) getIO().to(socketId).emit('message_recalled', payload);
        }

        return res.status(200).json({ success: true, data: { messageId: id, isRecalled: true } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};