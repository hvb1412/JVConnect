import express from 'express';
import { uploadImageByUrl } from '../controllers/upload.controller.js';

const router = express.Router();

router.post('/url', uploadImageByUrl);

export default router;
