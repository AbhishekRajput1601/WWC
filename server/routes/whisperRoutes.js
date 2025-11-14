import express from 'express';
import multer from 'multer';
import { transcribeAudioHandler } from '../controllers/captionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer();

router.use(protect);

// Use multer to parse the multipart/form-data audio upload under field name 'audio'
router.post('/transcribe', upload.single('audio'), transcribeAudioHandler);

export default router;
