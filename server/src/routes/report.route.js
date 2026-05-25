import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { submitReport } from '../controllers/report.controller.js';

const router = express.Router();

// POST /api/reports — user gửi báo cáo (user hoặc event)
router.post('/', authMiddleware, submitReport);

export default router;
