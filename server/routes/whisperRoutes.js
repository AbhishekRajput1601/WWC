import express from 'express';
import { transcribeAudioHandler } from '../controllers/captionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/transcribe', transcribeAudioHandler);

export default router;
