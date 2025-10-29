import Meeting from '../models/Meeting.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';


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

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Meeting has ended',
      });
    }

    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user.id && p.isActive
    );

    if (!existingParticipant) {
      meeting.participants.push({
        user: req.user.id,
        joinedAt: new Date(),
        isActive: true,
      });

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

    meeting.participants = meeting.participants.filter(
      p => p.user.toString() !== req.user.id
    );
    await meeting.save();

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

    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting',
      });
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();

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


export const addUserInMeeting = async (req, res) => {
  try {
    const { meetingId, userId } = req.body;
    // Find the meeting first
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    // Check if user is already a participant
    const alreadyParticipant = (meeting.participants || []).some(
      (p) => p.user && p.user.toString() === userId
    );
    if (alreadyParticipant) {
      await meeting.populate('participants.user', '-password');
      return res.status(200).json({
        success: true,
        message: 'User already in meeting',
        data: meeting
      });
    }
    // Add user as participant
    meeting.participants.push({ user: userId, joinedAt: new Date(), isActive: true });
    await meeting.save();
    await meeting.populate('participants.user', '-password');
    res.status(200).json({
      success: true,
      message: 'User added to meeting',
      data: meeting
    });
  } catch (error) {
    logger.error('Error adding user to meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding user to meeting',
    });
  }
};


export const deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOneAndDelete({ meetingId });
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meeting not found' 
      });
    }   
    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  }
  catch (error) {
    logger.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting meeting',
    });
  } 
};
