import express from 'express';
import userRoutes from './user.route.js';
import friendRoutes from './friend.route.js';
import messageRoutes from './message.route.js';
import authRoutes from './auth.route.js';
import conversationRoutes from './conversation.route.js';
import adminRoutes from './admin.route.js';
import eventRoutes from './event.route.js';
const router = express.Router();
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);
router.use('/messages', messageRoutes);
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);

// router.use('/users', userRoute);

export default router;