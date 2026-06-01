import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { sendMessage, pinMessage, recallMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.patch('/:id/pin', authMiddleware, pinMessage);
router.patch('/:id/recall', authMiddleware, recallMessage);

export default router;