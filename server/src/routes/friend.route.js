import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
    getFriendList,
    deleteFriend,
    sendFriendRequest,
    getIncomingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendStatus,
} from '../controllers/friend.controller.js';

const router = express.Router();

// ─── Specific routes first (before /:friendId) ──────────────────────────────

// Friend requests
router.get('/requests', authMiddleware, getIncomingRequests);
router.post('/requests', authMiddleware, sendFriendRequest);
router.post('/requests/:requestId/accept', authMiddleware, acceptFriendRequest);
router.delete('/requests/:requestId', authMiddleware, rejectFriendRequest);

// Friendship status with a specific user
router.get('/status/:targetUserId', authMiddleware, getFriendStatus);

// ─── General friend routes ───────────────────────────────────────────────────

router.get('/', authMiddleware, getFriendList);
router.delete('/:friendId', authMiddleware, deleteFriend);

export default router;