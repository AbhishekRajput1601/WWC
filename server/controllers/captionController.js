import Caption from '../models/Caption.js';
import logger from '../utils/logger.js';


export const getMeetingCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language, limit = 50, page = 1 } = req.query;

    let query = { meetingId };
    
    // If language filter is specified
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