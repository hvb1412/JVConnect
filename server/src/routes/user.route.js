import express from 'express';
import { getUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

// Route: GET /api/users/:id
// Mô tả: Lấy thông tin hồ sơ của một người dùng theo ID
router.get('/:id', getUserProfile);

export default router;
