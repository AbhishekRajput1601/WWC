import express from 'express';
import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeeting,
  getUserMeetings,
  addUserInMeeting,
  deleteMeeting,
  uploadRecording,
  getRecordings,
  getRecording,
} from '../controllers/meetingController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer();

const router = express.Router();

router.use(protect); 

router.route('/')
  .get(getUserMeetings)
  .post(createMeeting);

router.get('/:meetingId', getMeeting);
// Recording endpoints (creator only enforced in controller)
// Recording endpoints (creator only enforced in controller)
router.post('/:meetingId/recordings', upload.single('file'), uploadRecording);
router.get('/:meetingId/recordings', getRecordings);
router.get('/:meetingId/recordings/:recordingId', getRecording);
router.post('/:meetingId/join', joinMeeting);
router.post('/:meetingId/leave', leaveMeeting);
router.post('/:meetingId/end', endMeeting);
router.post('/add-user-in-meeting', addUserInMeeting);
router.delete('/delete-meeting/:meetingId', deleteMeeting);


export default router;