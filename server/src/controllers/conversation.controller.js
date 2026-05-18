import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const buildConversationSummary = async (conversation, userId) => {
    const [partner, latestMessage, unreadCount] = await Promise.all([
        conversation.user1?._id?.toString() === String(userId)
            ? conversation.user2
            : conversation.user1,
        Message.findOne({ conversation: conversation._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name email avatarURL'),
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
        partner,
        latestMessage,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
};

export const listConversations = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const conversations = await Conversation.find({
            $or: [{ user1: userId }, { user2: userId }],
        })
            .populate('user1', 'name email avatarURL')
            .populate('user2', 'name email avatarURL')
            .sort({ updatedAt: -1 });

        const data = await Promise.all(
            conversations.map((conversation) => buildConversationSummary(conversation, userId)),
        );

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const conversation = await Conversation.findById(id)
            .populate('user1', 'name email avatarURL')
            .populate('user2', 'name email avatarURL');

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const isParticipant =
            String(conversation.user1._id) === String(userId) ||
            String(conversation.user2._id) === String(userId);

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const messages = await Message.find({ conversation: conversation._id })
            .populate('sender', 'name email avatarURL')
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
