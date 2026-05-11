import express from 'express';

import {
    getUserById,
    updateProfile,
    getUserProfile,
    searchUsers
} from '../controllers/user.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/match', searchUsers);

router.put('/profile', authMiddleware, updateProfile);

router.get('/:id', authMiddleware, getUserById);

export default router;
