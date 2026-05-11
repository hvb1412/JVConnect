import express from 'express';

import {
    getUserById,
    updateProfile,
} from '../controllers/user.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:id', authMiddleware, getUserById);

router.put('/profile', authMiddleware, updateProfile);

export default router;