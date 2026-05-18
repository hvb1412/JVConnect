import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createEvent, deleteEvent, getEventById, listEvents, updateEvent } from '../controllers/event.controller.js';

const router = express.Router();

router.get('/', listEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);

export default router;
