import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import adminMiddleware from '../middlewares/admin.middleware.js';
import {
    getAdminOverview,
    getAdminStats,
    listAdmins,
    listReports,
    listUsers,
    getReportById,
    approveReport,
    rejectReport,
    deleteUser,
    toggleUserRestriction,
    listEvents,
    createEventByAdmin,
    updateEventByAdmin,
    deleteEventByAdmin,
    getUserById,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// Dashboard & Overview
router.get('/overview', getAdminOverview);
router.get('/stats', getAdminStats);

// Users
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.post('/users/:userId/restriction', toggleUserRestriction);
router.delete('/users/:userId', deleteUser);
router.get('/admins', listAdmins);

// Reports
router.get('/reports', listReports);
router.get('/reports/:id', getReportById);
router.post('/reports/:id/approve', approveReport);
router.post('/reports/:id/reject', rejectReport);

// Events
router.get('/events', listEvents);
router.post('/events', createEventByAdmin);
router.put('/events/:eventId', updateEventByAdmin);
router.delete('/events/:eventId', deleteEventByAdmin);

export default router;
