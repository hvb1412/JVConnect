import express from 'express';
import userRoutes from './user.route.js';
import friendRoutes from './friend.route.js';
import messageRoutes from './message.route.js';
import authRoutes from './auth.route.js';
const router = express.Router();
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);
router.use('/messages', messageRoutes);
router.use('/auth', authRoutes);

// router.use('/users', userRoute);

export default router;