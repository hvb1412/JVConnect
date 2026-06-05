import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

// ── Helper: build summary for DIRECT conversations ──────────────────────────
const buildDirectConversationSummary = async (conversation, userId) => {
    const partner =
        conversation.user1?._id?.toString() === String(userId)
            ? conversation.user2
            : conversation.user1;

    const [latestMessage, unreadCount] = await Promise.all([
        Message.findOne({ conversation: conversation._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name email avatarURL role"),
        Message.countDocuments({
            conversation: conversation._id,
            sender: { $ne: userId },
            seenStatus: false,
        }),
    ]);

    return {
        conversationId: conversation._id,
        type: "direct",
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

// ── Helper: build summary for GROUP conversations ────────────────────────────
const buildGroupConversationSummary = async (conversation, userId) => {
    const [latestMessage, unreadCount] = await Promise.all([
        Message.findOne({ conversation: conversation._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name email avatarURL role"),
        Message.countDocuments({
            conversation: conversation._id,
            sender: { $ne: userId },
            readBy: { $nin: [userId] },
            seenStatus: false,
        }),
    ]);

    return {
        conversationId: conversation._id,
        type: "group",
        name: conversation.name,
        avatarURL: conversation.avatarURL,
        members: conversation.members,
        admin: conversation.admin,
        eventId: conversation.eventId,
        latestMessage,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
};

// GET /conversations — trả về cả direct (accepted) và group conversations
export const listConversations = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const [directConvs, groupConvs] = await Promise.all([
            Conversation.find({
                type: "direct",
                $or: [{ user1: userId }, { user2: userId }],
                status: "accepted",
            })
                .populate("user1", "name email avatarURL role")
                .populate("user2", "name email avatarURL role")
                .sort({ updatedAt: -1 }),

            Conversation.find({
                type: "group",
                members: userId,
            })
                .populate("members", "name email avatarURL role")
                .populate("admin", "name email avatarURL role")
                .sort({ updatedAt: -1 }),
        ]);

        const [directData, groupData] = await Promise.all([
            Promise.all(directConvs.map((c) => buildDirectConversationSummary(c, userId))),
            Promise.all(groupConvs.map((c) => buildGroupConversationSummary(c, userId))),
        ]);

        // Merge và sort theo updatedAt
        const data = [...directData, ...groupData].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
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
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversations = await Conversation.find({
            type: "direct",
            $or: [{ user1: userId }, { user2: userId }],
            status: "pending",
            initiator: { $ne: userId },
        })
            .populate("user1", "name email avatarURL role")
            .populate("user2", "name email avatarURL role")
            .sort({ updatedAt: -1 });

        const data = await Promise.all(
            conversations.map((c) => buildDirectConversationSummary(c, userId))
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
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        if (String(conversation.initiator) === String(userId)) {
            return res.status(403).json({ success: false, message: "Only the receiver can accept a message request" });
        }

        const isParticipant =
            String(conversation.user1) === String(userId) ||
            String(conversation.user2) === String(userId);

        if (!isParticipant) return res.status(403).json({ success: false, message: "Forbidden" });

        if (conversation.status !== "pending") {
            return res.status(400).json({ success: false, message: "Conversation is not in pending state" });
        }

        conversation.status = "accepted";
        await conversation.save();

        return res.status(200).json({ success: true, message: "Message request accepted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /conversations/:id/decline — người nhận từ chối
export const declineConversation = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        if (String(conversation.initiator) === String(userId)) {
            return res.status(403).json({ success: false, message: "Only the receiver can decline a message request" });
        }

        const isParticipant =
            String(conversation.user1) === String(userId) ||
            String(conversation.user2) === String(userId);

        if (!isParticipant) return res.status(403).json({ success: false, message: "Forbidden" });

        await Message.deleteMany({ conversation: id });
        await Conversation.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Message request declined" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /conversations/:id — xóa conversation
export const deleteConversation = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        if (conversation.type !== "direct") {
            return res.status(400).json({ success: false, message: "Cannot delete group conversation this way" });
        }

        const isParticipant =
            String(conversation.user1) === String(userId) ||
            String(conversation.user2) === String(userId);

        if (!isParticipant) return res.status(403).json({ success: false, message: "Forbidden" });

        await Message.deleteMany({ conversation: id });
        await Conversation.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Conversation deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /conversations/with/:userId — lấy hoặc tạo direct conversation
export const getConversationWithUser = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { userId: partnerId } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
            return res.status(400).json({ success: false, message: "Invalid partner user ID" });
        }

        if (String(userId) === String(partnerId)) {
            return res.status(400).json({ success: false, message: "Cannot start conversation with yourself" });
        }

        const partner = await User.findById(partnerId).select("name email avatarURL role");
        if (!partner) return res.status(404).json({ success: false, message: "Partner user not found" });

        let conversation = await Conversation.findOne({
            type: "direct",
            $or: [
                { user1: userId, user2: partnerId },
                { user1: partnerId, user2: userId },
            ],
        });

        if (!conversation) {
            const isFriend = await Friend.exists({
                $or: [
                    { user1: userId, user2: partnerId },
                    { user1: partnerId, user2: userId },
                ],
            });

            conversation = await Conversation.create({
                type: "direct",
                user1: userId,
                user2: partnerId,
                status: isFriend ? "accepted" : "pending",
                initiator: isFriend ? null : userId,
            });
        }

        conversation = await Conversation.findById(conversation._id)
            .populate("user1", "name email avatarURL role")
            .populate("user2", "name email avatarURL role");

        const partnerData =
            String(conversation.user1._id) === String(userId)
                ? conversation.user2
                : conversation.user1;

        return res.status(200).json({
            success: true,
            data: { conversation, partner: partnerData },
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
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id)
            .populate("user1", "name email avatarURL role")
            .populate("user2", "name email avatarURL role")
            .populate("members", "name email avatarURL role")
            .populate("admin", "name email avatarURL role");

        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        // Check membership
        let isParticipant = false;
        if (conversation.type === "group") {
            isParticipant = conversation.members.some(
                (m) => String(m._id) === String(userId)
            );
        } else {
            isParticipant =
                String(conversation.user1._id) === String(userId) ||
                String(conversation.user2._id) === String(userId);
        }

        if (!isParticipant) return res.status(403).json({ success: false, message: "Forbidden" });

        const messages = await Message.find({ conversation: conversation._id })
            .populate("sender", "name email avatarURL role")
            .populate("pinnedBy", "name email avatarURL role")
            .sort({ createdAt: 1 });

        return res.status(200).json({ success: true, data: { conversation, messages } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /conversations/:id/read
export const markMessagesAsRead = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        if (conversation.type === "group") {
            // Với group: thêm userId vào readBy của từng message chưa đọc
            await Message.updateMany(
                {
                    conversation: id,
                    sender: { $ne: userId },
                    readBy: { $nin: [userId] },
                },
                { $addToSet: { readBy: userId } }
            );
        } else {
            await Message.updateMany(
                {
                    conversation: id,
                    sender: { $ne: userId },
                    seenStatus: false,
                },
                { $set: { seenStatus: true } }
            );
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── GROUP CHAT ────────────────────────────────────────────────────────────────

// POST /conversations/group — tạo group chat mới
export const createGroupChat = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { name, memberIds, avatarURL } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: "Group name is required" });
        }

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ success: false, message: "At least one member is required" });
        }

        // Validate memberIds are valid ObjectIds and exist
        const validMemberIds = memberIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id) && String(id) !== String(userId))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (validMemberIds.length === 0) {
            return res.status(400).json({ success: false, message: "No valid members provided" });
        }

        // Include creator in members
        const allMembers = [new mongoose.Types.ObjectId(userId), ...validMemberIds];

        const conversation = await Conversation.create({
            type: "group",
            name: String(name).trim(),
            avatarURL: avatarURL || "",
            members: allMembers,
            admin: userId,
        });

        const populated = await Conversation.findById(conversation._id)
            .populate("members", "name email avatarURL role")
            .populate("admin", "name email avatarURL role");

        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /conversations/:id/members — thêm thành viên vào group
export const addMemberToGroup = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        const { memberId } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation || conversation.type !== "group") {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (!conversation.members.some((m) => String(m) === String(userId))) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ success: false, message: "Invalid memberId" });
        }

        if (conversation.members.some((m) => String(m) === String(memberId))) {
            return res.status(400).json({ success: false, message: "User is already a member" });
        }

        conversation.members.push(memberId);
        await conversation.save();

        const populated = await Conversation.findById(id)
            .populate("members", "name email avatarURL role")
            .populate("admin", "name email avatarURL role");

        return res.status(200).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /conversations/:id/members/me — rời khỏi group
export const leaveGroup = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation || conversation.type !== "group") {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (!conversation.members.some((m) => String(m) === String(userId))) {
            return res.status(403).json({ success: false, message: "You are not a member of this group" });
        }

        conversation.members = conversation.members.filter(
            (m) => String(m) !== String(userId)
        );

        // Nếu admin rời và còn thành viên, chuyển admin cho người tiếp theo
        if (String(conversation.admin) === String(userId) && conversation.members.length > 0) {
            conversation.admin = conversation.members[0];
        }

        await conversation.save();

        return res.status(200).json({ success: true, message: "Left group successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /conversations/:id/pinned — lấy danh sách tin nhắn được ghim
export const getPinnedMessages = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

        const messages = await Message.find({
            conversation: id,
            isPinned: true,
            isRecalled: false,
        })
            .populate("sender", "name email avatarURL role")
            .populate("pinnedBy", "name email avatarURL role")
            .sort({ pinnedAt: -1 });

        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
