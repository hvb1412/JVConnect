import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.post('/', authMiddleware, sendMessage);

export default router;