import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import adminMiddleware from '../middlewares/admin.middleware.js';
import {
    getAdminOverview,
    getAdminStats,
    listAdmins,
    listReports,
    listUsers,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/overview', getAdminOverview);
router.get('/stats', getAdminStats);
router.get('/admins', listAdmins);
router.get('/users', listUsers);
router.get('/reports', listReports);

export default router;
