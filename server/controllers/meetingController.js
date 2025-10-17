import Meeting from '../models/Meeting.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req, res) => {
  try {
    const { title, description, settings = {} } = req.body;

    const meetingId = uuidv4();

    const meeting = await Meeting.create({
      meetingId,
      title,
      description,
      host: req.user.id,
      settings: {
        allowCaptions: settings.allowCaptions !== undefined ? settings.allowCaptions : true,
        allowTranslation: settings.allowTranslation !== undefined ? settings.allowTranslation : true,
        maxParticipants: settings.maxParticipants || 50,
        isRecording: settings.isRecording || false,
      },
    });

    const populatedMeeting = await Meeting.findById(meeting._id).populate('host', 'name email');

    logger.info(`Meeting created: ${meetingId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      meeting: populatedMeeting,
    });
  } catch (error) {
    logger.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating meeting',
    });
  }
};

// @desc    Join a meeting
// @route   POST /api/meetings/:meetingId/join
// @access  Private
export const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Check if meeting is active or can be started
    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Meeting has ended',
      });
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );

    if (!existingParticipant) {
      // Add user as participant
      meeting.participants.push({
        user: req.user.id,
        joinedAt: new Date(),
        isActive: true,
      });

      // If this is the host joining and meeting is scheduled, start it
      if (meeting.host.toString() === req.user.id && meeting.status === 'scheduled') {
        meeting.status = 'active';
        meeting.startTime = new Date();
      }

      await meeting.save();
    }

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email')
      .populate('participants.user', 'name email');

    logger.info(`User ${req.user.email} joined meeting: ${meetingId}`);

    res.json({
      success: true,
      meeting: populatedMeeting,
    });
  } catch (error) {
    logger.error('Join meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining meeting',
    });
  }
};

// @desc    Leave a meeting
// @route   POST /api/meetings/:meetingId/leave
// @access  Private
export const leaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Find and update participant
    const participant = meeting.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );

    if (participant) {
      participant.isActive = false;
      participant.leftAt = new Date();
      await meeting.save();
    }

    logger.info(`User ${req.user.email} left meeting: ${meetingId}`);

    res.json({
      success: true,
      message: 'Left meeting successfully',
    });
  } catch (error) {
    logger.error('Leave meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error leaving meeting',
    });
  }
};

// @desc    End a meeting
// @route   POST /api/meetings/:meetingId/end
// @access  Private (Host only)
export const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting',
      });
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();

    // Mark all active participants as inactive
    meeting.participants.forEach(participant => {
      if (participant.isActive) {
        participant.isActive = false;
        participant.leftAt = new Date();
      }
    });

    await meeting.save();

    logger.info(`Meeting ended: ${meetingId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Meeting ended successfully',
    });
  } catch (error) {
    logger.error('End meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending meeting',
    });
  }
};

// @desc    Get meeting details
// @route   GET /api/meetings/:meetingId
// @access  Private
export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId })
      .populate('host', 'name email')
      .populate('participants.user', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    logger.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting meeting details',
    });
  }
};

// @desc    Get user's meetings
// @route   GET /api/meetings
// @access  Private
export const getUserMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user.id },
        { 'participants.user': req.user.id }
      ]
    })
    .populate('host', 'name email')
    .populate('participants.user', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings,
    });
  } catch (error) {
    logger.error('Get user meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting meetings',
    });
  }
};