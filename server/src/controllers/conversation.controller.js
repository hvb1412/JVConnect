import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const buildConversationSummary = async (conversation, userId) => {
    const partner =
        conversation.user1?._id?.toString() === String(userId)
            ? conversation.user2
            : conversation.user1;

    const [latestMessage, unreadCount] = await Promise.all([
        Message.findOne({ conversation: conversation._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name email avatarURL"),
        Message.countDocuments({
            conversation: conversation._id,
            sender: { $ne: userId },
            seenStatus: false,
        }),
    ]);

    return {
        conversationId: conversation._id,
        user1: conversation.user1,
        user2: conversation.user2,
        status: conversation.status,
        initiator: conversation.initiator,
        partner,
        latestMessage,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
};

// GET /conversations — chỉ trả về các cuộc trò chuyện đã được chấp nhận
export const listConversations = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const conversations = await Conversation.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: "accepted",
        })
            .populate("user1", "name email avatarURL")
            .populate("user2", "name email avatarURL")
            .sort({ updatedAt: -1 });

        const data = await Promise.all(
            conversations.map((conversation) =>
                buildConversationSummary(conversation, userId),
            ),
        );

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /conversations/pending — tin nhắn chờ mà user là người nhận
export const getPendingConversations = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        // Lấy các conversation pending mà user là thành viên nhưng KHÔNG phải initiator
        const conversations = await Conversation.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: "pending",
            initiator: { $ne: userId },
        })
            .populate("user1", "name email avatarURL")
            .populate("user2", "name email avatarURL")
            .sort({ updatedAt: -1 });

        const data = await Promise.all(
            conversations.map((conversation) =>
                buildConversationSummary(conversation, userId),
            ),
        );

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /conversations/:id/accept — người nhận chấp nhận message request
export const acceptConversation = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res
                .status(404)
                .json({ success: false, message: "Conversation not found" });
        }

        // Chỉ người nhận (không phải initiator) mới được accept
        if (String(conversation.initiator) === String(userId)) {
            return res.status(403).json({
                success: false,
                message: "Only the receiver can accept a message request",
            });
        }

        const isParticipant =
            String(conversation.user1) === String(userId) ||
            String(conversation.user2) === String(userId);

        if (!isParticipant) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden" });
        }

        if (conversation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Conversation is not in pending state",
            });
        }

        conversation.status = "accepted";
        await conversation.save();

        return res.status(200).json({
            success: true,
            message: "Message request accepted",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /conversations/:id/decline — người nhận từ chối (xóa im lặng, không notify sender)
export const declineConversation = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res
                .status(404)
                .json({ success: false, message: "Conversation not found" });
        }

        // Chỉ người nhận (không phải initiator) mới được decline
        if (String(conversation.initiator) === String(userId)) {
            return res.status(403).json({
                success: false,
                message: "Only the receiver can decline a message request",
            });
        }

        const isParticipant =
            String(conversation.user1) === String(userId) ||
            String(conversation.user2) === String(userId);

        if (!isParticipant) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden" });
        }

        // Xóa toàn bộ messages + conversation (âm thầm, không notify sender)
        await Message.deleteMany({ conversation: id });
        await Conversation.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Message request declined",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /conversations/with/:userId — lấy hoặc tạo conversation với user khác
export const getConversationWithUser = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { userId: partnerId } = req.params;

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid partner user ID" });
        }

        if (String(userId) === String(partnerId)) {
            return res.status(400).json({
                success: false,
                message: "Cannot start conversation with yourself",
            });
        }

        const partner = await User.findById(partnerId).select(
            "name email avatarURL",
        );

        if (!partner) {
            return res
                .status(404)
                .json({ success: false, message: "Partner user not found" });
        }

        // Kiểm tra đã có conversation chưa (bất kể status)
        let conversation = await Conversation.findOne({
            $or: [
                { user1: userId, user2: partnerId },
                { user1: partnerId, user2: userId },
            ],
        });

        if (!conversation) {
            // Kiểm tra friendship để xác định status
            const isFriend = await Friend.exists({
                $or: [
                    { user1: userId, user2: partnerId },
                    { user1: partnerId, user2: userId },
                ],
            });

            conversation = await Conversation.create({
                user1: userId,
                user2: partnerId,
                status: isFriend ? "accepted" : "pending",
                initiator: isFriend ? null : userId,
            });
        }

        conversation = await Conversation.findById(conversation._id)
            .populate("user1", "name email avatarURL")
            .populate("user2", "name email avatarURL");

        const partnerData =
            String(conversation.user1._id) === String(userId)
                ? conversation.user2
                : conversation.user1;

        return res.status(200).json({
            success: true,
            data: {
                conversation,
                partner: partnerData,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /conversations/:id/messages
export const getConversationMessages = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const conversation = await Conversation.findById(id)
            .populate("user1", "name email avatarURL")
            .populate("user2", "name email avatarURL");

        if (!conversation) {
            return res
                .status(404)
                .json({ success: false, message: "Conversation not found" });
        }

        const isParticipant =
            String(conversation.user1._id) === String(userId) ||
            String(conversation.user2._id) === String(userId);

        if (!isParticipant) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden" });
        }

        const messages = await Message.find({ conversation: conversation._id })
            .populate("sender", "name email avatarURL")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            data: {
                conversation,
                messages,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /conversations/:id/read
export const markMessagesAsRead = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await Message.updateMany(
            {
                conversation: id,
                sender: { $ne: userId },
                seenStatus: false,
            },
            { $set: { seenStatus: true } },
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
