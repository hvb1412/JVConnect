import Friend from '../models/Friend.js';
import FriendRequest from '../models/FriendRequest.js';

const FRIEND_PROJECTION = 'name email avatarURL area occupation introduction latestBanDate';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

// ─── Friend List ────────────────────────────────────────────────────────────

export const getFriendList = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const friendships = await Friend.find({
            $or: [{ user1: userId }, { user2: userId }],
        })
            .populate('user1', FRIEND_PROJECTION)
            .populate('user2', FRIEND_PROJECTION)
            .sort({ updatedAt: -1 });

        const data = friendships
            .map((friendship) => {
                const user1 = friendship.user1;
                const user2 = friendship.user2;

                if (!user1 || !user2) return null;

                const friend = String(user1._id) === String(userId) ? user2 : user1;

                // Never return the current user even if the friendship record is malformed
                if (!friend || String(friend._id) === String(userId)) {
                    return null;
                }

                return { friendshipId: friendship._id, friend };
            })
            .filter(Boolean)
            .filter((item, index, array) => {
                const friendId = String(item.friend._id);
                return array.findIndex((candidate) => String(candidate.friend._id) === friendId) === index;
            })
            ;

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Delete Friend ──────────────────────────────────────────────────────────

export const deleteFriend = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { friendId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!friendId) {
            return res.status(400).json({ success: false, message: 'friendId is required' });
        }

        const deletedFriendship = await Friend.findOneAndDelete({
            $or: [
                { user1: userId, user2: friendId },
                { user1: friendId, user2: userId },
            ],
        });

        if (!deletedFriendship) {
            return res.status(404).json({ success: false, message: 'Friend relationship not found' });
        }

        return res.status(200).json({ success: true, message: 'Friend deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Friend Requests ────────────────────────────────────────────────────────

/**
 * POST /api/friends/requests
 * Send a friend request to another user.
 */
export const sendFriendRequest = async (req, res) => {
    try {
        const senderId = getAuthUserId(req);
        const { receiverId } = req.body;

        if (!senderId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!receiverId) {
            return res.status(400).json({ success: false, message: 'receiverId is required' });
        }

        if (String(senderId) === String(receiverId)) {
            return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
        }

        // Check if already friends
        const alreadyFriends = await Friend.findOne({
            $or: [
                { user1: senderId, user2: receiverId },
                { user1: receiverId, user2: senderId },
            ],
        });

        if (alreadyFriends) {
            return res.status(409).json({ success: false, message: 'Already friends' });
        }

        // Check if a pending request already exists (either direction)
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        });

        if (existingRequest) {
            return res.status(409).json({ success: false, message: 'Friend request already exists' });
        }

        const friendRequest = await FriendRequest.create({ sender: senderId, receiver: receiverId });

        return res.status(201).json({ success: true, data: friendRequest });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/friends/requests
 * Get all incoming friend requests for the authenticated user.
 */
export const getIncomingRequests = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const requests = await FriendRequest.find({ receiver: userId })
            .populate('sender', FRIEND_PROJECTION)
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/friends/requests/:requestId/accept
 * Accept an incoming friend request.
 */
export const acceptFriendRequest = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { requestId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found' });
        }

        if (String(friendRequest.receiver) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // Create friendship
        await Friend.create({ user1: friendRequest.sender, user2: friendRequest.receiver });

        // Remove the request
        await FriendRequest.findByIdAndDelete(requestId);

        return res.status(200).json({ success: true, message: 'Friend request accepted' });
    } catch (error) {
        // Handle duplicate friendship gracefully
        if (error.code === 11000) {
            await FriendRequest.findByIdAndDelete(req.params.requestId).catch(() => {});
            return res.status(200).json({ success: true, message: 'Already friends' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/friends/requests/:requestId
 * Reject (or cancel) a friend request.
 */
export const rejectFriendRequest = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { requestId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found' });
        }

        // Only the receiver or the sender can remove the request
        const isReceiver = String(friendRequest.receiver) === String(userId);
        const isSender = String(friendRequest.sender) === String(userId);

        if (!isReceiver && !isSender) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        await FriendRequest.findByIdAndDelete(requestId);

        return res.status(200).json({ success: true, message: 'Friend request removed' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/friends/status/:targetUserId
 * Get the friendship status between the authenticated user and a target user.
 * Returns: { status: "friend" | "sent" | "received" | "none" }
 */
export const getFriendStatus = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { targetUserId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (String(userId) === String(targetUserId)) {
            return res.status(200).json({ success: true, data: { status: 'self' } });
        }

        // Check friendship
        const friendship = await Friend.findOne({
            $or: [
                { user1: userId, user2: targetUserId },
                { user1: targetUserId, user2: userId },
            ],
        });

        if (friendship) {
            return res.status(200).json({ success: true, data: { status: 'friend' } });
        }

        // Check sent request
        const sentRequest = await FriendRequest.findOne({ sender: userId, receiver: targetUserId });
        if (sentRequest) {
            return res.status(200).json({ success: true, data: { status: 'sent', requestId: sentRequest._id } });
        }

        // Check received request
        const receivedRequest = await FriendRequest.findOne({ sender: targetUserId, receiver: userId });
        if (receivedRequest) {
            return res.status(200).json({ success: true, data: { status: 'received', requestId: receivedRequest._id } });
        }

        return res.status(200).json({ success: true, data: { status: 'none' } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};