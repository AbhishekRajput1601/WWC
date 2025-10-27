import express from 'express';
import { 
  register, 
  login, 
  logout,
  getMe, 
  updateUserDetails,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/update-details', protect, updateUserDetails);


export default router;