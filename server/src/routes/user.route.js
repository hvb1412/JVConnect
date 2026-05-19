import express from 'express';

import {
    getUserById,
    updateProfile,
    getUserProfile,
    searchUsers,
    getSuggestedUsers
} from '../controllers/user.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/match', searchUsers);
router.get('/suggested', getSuggestedUsers);

router.put('/profile', authMiddleware, updateProfile);

router.get('/:id', authMiddleware, getUserById);

export default router;
