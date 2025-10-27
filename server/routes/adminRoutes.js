import express from 'express';
import { 
  getAllUser, 
  getAllUsersMeetings,
  getAllUserInMeetings,
} from '../controllers/adminController.js';

import { updateUserDetails} from '../controllers/authController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', protect, getAllUser);
router.put('/users/details', protect, updateUserDetails);

router.get('/users-meetings', protect, getAllUsersMeetings);
router.get('/meetings-users', protect, getAllUserInMeetings);



export default router;
