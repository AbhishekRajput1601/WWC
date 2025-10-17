import express from 'express';
import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeeting,
  getUserMeetings
} from '../controllers/meetingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
  .get(getUserMeetings)
  .post(createMeeting);

router.get('/:meetingId', getMeeting);
router.post('/:meetingId/join', joinMeeting);
router.post('/:meetingId/leave', leaveMeeting);
router.post('/:meetingId/end', endMeeting);

export default router;