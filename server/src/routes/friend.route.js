import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { deleteFriend, getFriendList } from '../controllers/friend.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getFriendList);
router.delete('/:friendId', authMiddleware, deleteFriend);

export default router;