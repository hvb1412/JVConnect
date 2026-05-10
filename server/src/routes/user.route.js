import express from 'express';
import {
    getProfile,
    updateProfile,
    getUserProfile,
    searchUsers
} from '../controllers/user.controller.js';

import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);

router.put('/profile', authMiddleware, updateProfile);

router.get('/match', searchUsers);

router.get('/:id', getUserProfile);

export default router;
