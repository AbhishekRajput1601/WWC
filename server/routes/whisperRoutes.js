import express from 'express';
import multer from 'multer';
import { transcribeAudioHandler } from '../controllers/captionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer();

router.use(protect);


router.post('/transcribe', upload.single('audio'), transcribeAudioHandler);

export default router;
