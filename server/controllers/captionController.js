import Caption from '../models/Caption.js';
import logger from '../utils/logger.js';
import { transcribeAudio } from '../services/captionsWhisperService.js';
import fs from 'fs';

export const transcribeAudioHandler = async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }
  const audioFile = req.files.audio;
  const tempDir = 'audioFile';
  const tempPath = `${tempDir}/temp_${Date.now()}_${audioFile.name}`;
  await audioFile.mv(tempPath);

    const language = req.body.language || null;
    const translate = req.body.translate === 'true';
    // Try to get meetingId from body, query, or headers (FormData can be tricky)
    let meetingId = req.body.meetingId || req.query.meetingId || req.headers['x-meeting-id'];
    if (!meetingId && req.body && typeof req.body === 'object') {
      // Try to extract from FormData
      for (const key in req.body) {
        if (key.toLowerCase().includes('meeting')) {
          meetingId = req.body[key];
          break;
        }
      }
    }
    const speaker = req.user?._id;
    const result = await transcribeAudio(tempPath, language, translate);

    fs.unlinkSync(tempPath);

    // Save each caption segment to DB, log if missing info
    if (!meetingId) {
      logger.warn('No meetingId provided, captions will not be saved.');
    }
    if (!speaker) {
      logger.warn('No speaker (user) found, captions will not be saved.');
    }
    if (result.captions && Array.isArray(result.captions)) {
      let savedCount = 0;
      for (const segment of result.captions) {
        if (meetingId && speaker) {
          try {
            const captionDoc = new Caption({
              meetingId,
              speaker,
              originalText: segment.text,
              originalLanguage: segment.language || language || 'en',
              translations: segment.translations || [],
              confidence: segment.confidence || 0.8,
              timestamp: segment.timestamp ? new Date(segment.timestamp) : new Date(),
              duration: segment.duration || 0,
              isFinal: segment.isFinal || true,
            });
            await captionDoc.save();
            savedCount++;
          } catch (err) {
            logger.error('Error saving caption:', err);
          }
        }
      }
      logger.info(`Saved ${savedCount} captions for meetingId=${meetingId}`);
    } else {
      logger.warn('No captions returned from Whisper, nothing to save.');
    }

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Whisper transcription error:', error);
    res.status(500).json({ success: false, message: 'Transcription failed', error });
  }
};


export const getMeetingCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language, limit = 50, page = 1 } = req.query;

    let query = { meetingId };
  
    if (language && language !== 'all') {
      query.$or = [
        { originalLanguage: language },
        { 'translations.language': language }
      ];
    }

    const captions = await Caption.find(query)
      .populate('speaker', 'name email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      captions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Caption.countDocuments(query)
      }
    });
  } catch (error) {
    logger.error('Get meeting captions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting captions',
    });
  }
};


export const exportCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language = 'original', format = 'txt' } = req.query;

    const captions = await Caption.find({ meetingId })
      .populate('speaker', 'name email')
      .sort({ timestamp: 1 });

    let content = '';
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'txt') {
      content = `Meeting Captions - ${meetingId}\nExported: ${timestamp}\n\n`;
      
      captions.forEach(caption => {
        const time = caption.timestamp.toLocaleTimeString();
        const speaker = caption.speaker.name;
        
        let text = caption.originalText;
        if (language !== 'original' && language !== caption.originalLanguage) {
          const translation = caption.translations.find(t => t.language === language);
          if (translation) {
            text = translation.text;
          }
        }
        
        content += `[${time}] ${speaker}: ${text}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="captions-${meetingId}-${timestamp}.txt"`);
    res.send(content);

  } catch (error) {
    logger.error('Export captions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting captions',
    });
  }
};