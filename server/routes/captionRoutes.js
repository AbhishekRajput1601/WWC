import express from 'express';
import { getMeetingCaptions, exportCaptions } from '../controllers/captionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/:meetingId', getMeetingCaptions);
router.get('/:meetingId/export', exportCaptions);

export default router;