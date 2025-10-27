import express from 'express';
import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeeting,
  getUserMeetings,
  addUserInMeeting,
  deleteMeeting
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
router.post('/add-user-in-meeting', addUserInMeeting);
router.delete('/delete-meeting/:meetingId', deleteMeeting);


export default router;