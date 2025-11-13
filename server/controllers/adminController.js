import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';


export const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating preferences',
    });
  }
};


export const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users data',
    });
  }
};


export const getAllUsersMeetings = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersMeetings = await Promise.all(
      users.map(async (user) => {
        const meetings = await Meeting.find({ user: user._id });
        return {
          user,
          meetings
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersMeetings
    });
  } catch (error) {
    logger.error('Error fetching users meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users meetings',
    });
  }
};


export const getAllUserInMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('host', 'name email')
      .populate('participants.user', '-password');
    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    logger.error('Error fetching meetings with users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching meetings with users',
    });
  }
};

export const getMeetingCaptionsText = async (req, res) => {
  try {
    // ensure admin (role-based)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (!meeting.captionsTextPath) {
      return res.status(404).json({ success: false, message: 'No captions file available for this meeting' });
    }
    try {
      const filePath = meeting.captionsTextPath;
      const content = await fs.readFile(filePath, { encoding: 'utf8' });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (err) {
      logger.error('Error reading captions file:', err);
      return res.status(500).json({ success: false, message: 'Error reading captions file' });
    }
  } catch (error) {
    logger.error('getMeetingCaptionsText error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



