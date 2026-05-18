import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { listConversations, getConversationMessages } from '../controllers/conversation.controller.js';

const router = express.Router();

router.get('/', authMiddleware, listConversations);
router.get('/:id/messages', authMiddleware, getConversationMessages);

export default router;
