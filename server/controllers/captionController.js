import Caption from '../models/Caption.js';
import logger from '../utils/logger.js';
import { transcribeAudio } from '../services/captionsWhisperService.js';
import fs from 'fs';
import path from 'path';

export const transcribeAudioHandler = async (req, res) => {
  try {
    // multer provides the uploaded file as `req.file` when using upload.single('audio')
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }

    const audioFile = req.file; // { buffer, originalname, mimetype }
    const tempDir = path.join(process.cwd(), 'audioFile');
    try { await fs.promises.mkdir(tempDir, { recursive: true }); } catch (e) {}
    const safeName = (audioFile.originalname || 'audio').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const tempPath = path.join(tempDir, `temp_${Date.now()}_${safeName}`);
    await fs.promises.writeFile(tempPath, audioFile.buffer);

    const language = (req.body && req.body.language) ? req.body.language : null;
  // Always transcribe, never use Whisper's translate
  const translate = false;
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
    try { await fs.promises.unlink(tempPath); } catch (e) {}

    // LibreTranslate integration
    let translatedCaptions = [];
    if (language && language !== 'en' && result.captions && Array.isArray(result.captions)) {
      try {
        const axios = (await import('axios')).default;
        for (const segment of result.captions) {
          let translatedText = '';
          let attempts = 0;
          while (attempts < 3 && !translatedText) {
            try {
              const translationRes = await axios.post('https://libretranslate.de/translate', {
                q: segment.text,
                source: 'en',
                target: language,
                format: 'text'
              });
              translatedText = translationRes.data.translatedText;
              if (!translatedText || !translatedText.trim()) {
                logger.warn(`Empty translation for: ${segment.text} (attempt ${attempts + 1})`);
              }
            } catch (err) {
              logger.error(`LibreTranslate error (attempt ${attempts + 1}):`, err);
            }
            attempts++;
            if (!translatedText) await new Promise(res => setTimeout(res, 500)); // wait before retry
          }
          translatedCaptions.push({
            ...segment,
            text: translatedText && translatedText.trim() ? translatedText : segment.text // fallback to original if empty
          });
        }
      } catch (err) {
        logger.error('LibreTranslate error:', err);
        translatedCaptions = result.captions;
      }
    } else {
      translatedCaptions = result.captions;
    }

    if (!meetingId) {
      logger.warn('No meetingId provided, captions will not be saved.');
    }
    if (!speaker) {
      logger.warn('No speaker (user) found, captions will not be saved.');
    }

    const filteredCaptions = (translatedCaptions || []).filter(
      (seg) => seg.text && seg.text.trim().length > 2
    );

    if (!filteredCaptions.length) {
      logger.warn('No captions returned from Whisper, nothing to save.');
      return res.json({ success: true, captions: [], language: language || 'en' });
    }

    let savedCount = 0;
    for (const segment of filteredCaptions) {
      if (!meetingId || !speaker) continue;
      try {
        const entry = {
          speaker,
          originalText: segment.text,
          originalLanguage: language || 'en',
          translations: [],
          confidence: segment.confidence || 0.8,
          timestamp: segment.timestamp ? new Date(segment.timestamp) : new Date(),
          duration: segment.duration || 0,
          isFinal: segment.isFinal !== undefined ? !!segment.isFinal : true,
        };

        await Caption.findOneAndUpdate(
          { meetingId },
          { $push: { captions: entry } },
          { upsert: true, new: true }
        );
        savedCount++;
      } catch (err) {
        logger.error('Error saving caption entry:', err);
      }
    }

    logger.info(`Appended ${savedCount} captions for meetingId=${meetingId}`);

    res.json({ success: true, captions: filteredCaptions, language: language || 'en' });
  } catch (error) {
    logger.error('Whisper transcription error:', error);
    res.status(500).json({ success: false, message: 'Transcription failed', error });
  }
};


export const getMeetingCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language, limit = 50, page = 1 } = req.query;

    const doc = await Caption.findOne({ meetingId }).populate('captions.speaker', 'name email');
    if (!doc) {
      return res.json({ success: true, captions: [], pagination: { page: 1, limit: 0, total: 0 } });
    }

    let items = doc.captions || [];
    if (language && language !== 'all') {
      items = items.filter((c) => c.originalLanguage === language || (c.translations || []).some(t => t.language === language));
    }


    items = items.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = items.length;
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const start = (p - 1) * l;
    const paged = items.slice(start, start + l);

    res.json({
      success: true,
      captions: paged,
      pagination: { page: p, limit: l, total }
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
    const doc = await Caption.findOne({ meetingId }).populate('captions.speaker', 'name email');
    const items = doc ? (doc.captions || []) : [];

    let content = '';
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'txt') {
      content = `Meeting Captions - ${meetingId}\nExported: ${timestamp}\n\n`;

  
      items.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach((caption) => {
        const time = new Date(caption.timestamp).toLocaleTimeString();
        const speaker = caption.speaker ? caption.speaker.name : 'Unknown';

        let text = caption.originalText;
        if (language !== 'original' && language !== caption.originalLanguage) {
          const translation = (caption.translations || []).find((t) => t.language === language);
          if (translation) text = translation.text;
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