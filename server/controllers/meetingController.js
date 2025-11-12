import Meeting from '../models/Meeting.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';


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
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
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


export const uploadRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the meeting host can upload recordings' });
    }

    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    meeting.recordings = meeting.recordings || [];
    const placeholder = {
      public_id: null,
      url_high: null,
      url_low: null,
      duration: null,
      bytes: file.buffer.length || file.size || 0,
      uploadedAt: new Date(),
      uploadedBy: req.user.id,
      status: 'processing',
    };

    meeting.recordings.push(placeholder);
    await meeting.save();

    // keep reference to the pushed recording _id so we can update it after uploading
    const pushedRecordingId = meeting.recordings[meeting.recordings.length - 1]._id;

    const fileSizeBytes = placeholder.bytes || 0;
    logger.info(`Uploading recording for meeting ${meetingId}, size=${fileSizeBytes} bytes`);

    const uploadOptions = {
      resource_type: 'video',
      folder: 'meetings',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      eager: [
        { format: 'mp4', quality: 'auto:low', width: 144, crop: 'limit' }
      ],
    };

    let uploadResult = null;

    const MAX_IN_MEMORY = 10 * 1024 * 1024; // 10 MB
    const RETRIES = 3;

    if (fileSizeBytes > MAX_IN_MEMORY) {
      const tmpDir = os.tmpdir();
      const tmpFilename = `meeting-recording-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
      const tmpPath = path.join(tmpDir, tmpFilename);
      await fs.writeFile(tmpPath, file.buffer);

      try {
        for (let attempt = 1; attempt <= RETRIES; attempt++) {
          try {
            logger.info(`Cloudinary upload attempt ${attempt} for ${tmpPath}`);
            uploadResult = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_large(
                tmpPath,
                { ...uploadOptions, chunk_size: 6000000 },
                (err, result) => err ? reject(err) : resolve(result)
              );
            });
            break;
          } catch (err) {
            logger.warn(`Cloudinary upload attempt ${attempt} failed: ${err && err.message}`);
            if (attempt === RETRIES) throw err;
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      } finally {
        try { await fs.unlink(tmpPath); } catch (e) {  }
      }
    } else {
      uploadResult = await new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        const readableStream = new Readable();
        readableStream._read = () => {};
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.pipe(upload_stream);
      });
    }

    // Update the pushed recording entry with actual upload result
    const rec = meeting.recordings.id(pushedRecordingId);
    if (rec) {
      rec.public_id = uploadResult.public_id;
      rec.url_high = uploadResult.secure_url || uploadResult.url;
      rec.url_low = (uploadResult.eager && uploadResult.eager[0] && uploadResult.eager[0].secure_url) || null;
      rec.duration = uploadResult.duration || null;
      rec.bytes = uploadResult.bytes || rec.bytes || null;
      rec.uploadedAt = new Date();
      rec.uploadedBy = req.user.id;
      rec.status = 'ready';
    }

    meeting.settings = meeting.settings || {};
    meeting.settings.isRecording = true;

    await meeting.save();

    logger.info(`Recording uploaded for meeting ${meetingId} by ${req.user.email}`);

    return res.status(200).json({ success: true, recording: rec });
  } catch (error) {
    logger.error('Upload recording error:', error);
    try {
      const { meetingId } = req.params;
      const meeting = await Meeting.findOne({ meetingId });
      if (meeting) {
        // mark last pushed recording (if present) as failed
        if (meeting.recordings && meeting.recordings.length > 0) {
          const last = meeting.recordings[meeting.recordings.length - 1];
          last.status = 'failed';
        }
        await meeting.save();
      }
    } catch (e) {
      logger.error('Failed to mark recording as failed:', e);
    }

    return res.status(500).json({ success: false, message: 'Server error uploading recording' });
  }
};

export const getRecordings = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId }).populate('recordings.uploadedBy', 'name email');
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.json({ success: true, recordings: meeting.recordings || [] });
  } catch (error) {
    logger.error('Get recordings error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching recordings' });
  }
};

export const getRecording = async (req, res) => {
  try {
    const { meetingId, recordingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId }).populate('recordings.uploadedBy', 'name email');
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (!recordingId) {
      return res.status(400).json({ success: false, message: 'recordingId is required' });
    }

    const rec = meeting.recordings.id(recordingId);
    if (!rec || !rec.public_id) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    return res.json({ success: true, recording: rec });
  } catch (error) {
    logger.error('Get recording error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching recording' });
  }
};
