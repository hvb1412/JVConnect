import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createEvent, deleteEvent, getEventById, listEvents, updateEvent, getSuggestedEvents, joinEvent,cancelJoinEvent,reportEvent,} from '../controllers/event.controller.js';
import  protect  from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get('/suggested', getSuggestedEvents);
router.get('/', listEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);
router.post('/:id/join', protect, joinEvent)
router.post('/:id/cancel', protect, cancelJoinEvent)
router.post('/:id/report', protect, reportEvent)

export default router;
