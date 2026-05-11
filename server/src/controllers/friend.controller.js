import Friend from '../models/Friend.js';

const FRIEND_PROJECTION = 'name email avatarURL area occupation introduction latestBanDate';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

export const getFriendList = async (req, res) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
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

                if (!user1 || !user2) {
                    return null;
                }

                const friend = String(user1._id) === String(userId) ? user2 : user1;

                return {
                    friendshipId: friendship._id,
                    friend,
                };
            })
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteFriend = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { friendId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'friendId is required',
            });
        }

        const deletedFriendship = await Friend.findOneAndDelete({
            $or: [
                { user1: userId, user2: friendId },
                { user1: friendId, user2: userId },
            ],
        });

        if (!deletedFriendship) {
            return res.status(404).json({
                success: false,
                message: 'Friend relationship not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Friend deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};