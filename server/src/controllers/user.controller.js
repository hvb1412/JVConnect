import User from "../models/User.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Participation from "../models/Participation.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const getAuthUserIdFromHeader = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded?.id || decoded?.userId || null;
    } catch {
        return null;
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select("-password -confirmCode");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const friendCount = await Friend.countDocuments({
            $or: [{ user1: id }, { user2: id }],
        });

        const eventsAttended = await Participation.countDocuments({ user: id });

        return res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                friendCount,
                eventsAttended,
            },
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { name, avatarURL, area, occupation, introduction } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                avatarURL,
                area,
                occupation,
                introduction,
                needsProfileUpdate: false,
            },
            {
                returnDocument: 'after',
            },
        ).select("-password -confirmCode");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "現在のパスワードと新しいパスワードを入力してください",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "現在のパスワードが正しくありません",
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "パスワードを変更しました",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await Friend.deleteMany({
            $or: [{ user1: userId }, { user2: userId }],
        });
        await FriendRequest.deleteMany({
            $or: [{ sender: userId }, { receiver: userId }],
        });
        await Participation.deleteMany({ user: userId });

        const conversations = await Conversation.find({
            $or: [{ user1: userId }, { user2: userId }],
        });
        const conversationIds = conversations.map((conversation) => conversation._id);

        await Message.deleteMany({
            $or: [
                { sender: userId },
                { conversation: { $in: conversationIds } },
            ],
        });
        await Conversation.deleteMany({ _id: { $in: conversationIds } });
        await Report.deleteMany({
            $or: [
                { reporter: userId },
                { user: userId },
                { decidedBy: userId },
            ],
        });

        return res.status(200).json({
            success: true,
            message: "アカウントを削除しました",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res
                .status(400)
                .json({ message: "ID người dùng không hợp lệ" });
        }
        res.status(500).json({ message: "Lỗi Server" });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword, area, occupation } = req.query;
        const currentUserId = getAuthUserIdFromHeader(req);
        let query = {};

        if (keyword) {
            query.name = { $regex: keyword, $options: "i" };
        }
        if (area) {
            query.area = { $regex: area, $options: "i" };
        }
        if (occupation) {
            query.occupation = { $regex: occupation, $options: "i" };
        }

        if (currentUserId) {
            query._id = { $ne: currentUserId };
        }

        const users = await User.find(query).select("-password -confirmCode");

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = getAuthUserIdFromHeader(req);
        const LIMIT = 8;

        // Exclude admins and optionally the current user
        const query = { role: { $ne: 'admin' } };
        if (currentUserId) query._id = { $ne: currentUserId };

        // Fetch a reasonable candidate set
        const users = await User.find(query).select("-password -confirmCode").lean();

        if (!currentUserId) {
            // If not authenticated, return random users
            const shuffled = users.sort(() => Math.random() - 0.5).slice(0, LIMIT);
            return res.status(200).json({ success: true, data: shuffled });
        }

        // Get current user's friends
        const friendships = await Friend.find({ $or: [{ user1: currentUserId }, { user2: currentUserId }] });
        const friendIds = new Set(
            friendships.map((f) => (String(f.user1) === String(currentUserId) ? String(f.user2) : String(f.user1)))
        );

        const candidateIds = users.map((u) => String(u._id));

        // Count mutual friendships in bulk
        const mutualFriendships = await Friend.find({
            $or: [
                { user1: { $in: Array.from(friendIds) }, user2: { $in: candidateIds } },
                { user1: { $in: candidateIds }, user2: { $in: Array.from(friendIds) } },
            ],
        });

        const mutualCountMap = {};
        mutualFriendships.forEach((f) => {
            const u1 = String(f.user1);
            const u2 = String(f.user2);
            // candidate is the one that's not in friendIds
            let candidateId = null;
            if (friendIds.has(u1) && candidateIds.includes(u2)) candidateId = u2;
            if (friendIds.has(u2) && candidateIds.includes(u1)) candidateId = u1;
            if (candidateId) mutualCountMap[candidateId] = (mutualCountMap[candidateId] || 0) + 1;
        });

        // Score users by mutual friends, then occupation, then area
        const scored = users.map((u) => {
            const id = String(u._id);
            const mutual = mutualCountMap[id] || 0;
            const occupationMatch = u.occupation && req.query.occupation ? String(u.occupation).toLowerCase() === String(req.query.occupation).toLowerCase() : false;
            const areaMatch = u.area && req.query.area ? String(u.area).toLowerCase() === String(req.query.area).toLowerCase() : false;
            return { user: u, mutual, occupationMatch: occupationMatch ? 1 : 0, areaMatch: areaMatch ? 1 : 0 };
        });

        scored.sort((a, b) => {
            if (b.mutual !== a.mutual) return b.mutual - a.mutual;
            if (b.occupationMatch !== a.occupationMatch) return b.occupationMatch - a.occupationMatch;
            if (b.areaMatch !== a.areaMatch) return b.areaMatch - a.areaMatch;
            return 0;
        });

        // If all scores are zero, return random
        const topScore = scored.length > 0 ? (scored[0].mutual + scored[0].occupationMatch + scored[0].areaMatch) : 0;
        let result;
        if (topScore === 0) {
            result = scored.map((s) => s.user).sort(() => Math.random() - 0.5).slice(0, LIMIT);
        } else {
            result = scored.slice(0, LIMIT).map((s) => s.user);
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
