import Caption from "../models/Caption.js";
import logger from "../utils/logger.js";
import { transcribeAudio } from "../services/captionsWhisperService.js";

export const transcribeAudioHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No audio file uploaded." });
    }

    const audioFile = req.file;
    const tempPath = null;

    const requestedLanguage =
      req.body && req.body.language ? req.body.language : null;


    const translate =
      req.body && (req.body.translate === true || req.body.translate === 'true')
        ? true
        : false;

    let meetingId =
      req.body.meetingId || req.query.meetingId || req.headers["x-meeting-id"];
    if (!meetingId && req.body && typeof req.body === "object") {
      for (const key in req.body) {
        if (key.toLowerCase().includes("meeting")) {
          meetingId = req.body[key];
          break;
        }
      }
    }
    const speaker = req.user?._id;

    const result = await transcribeAudio(
      audioFile.buffer,
      requestedLanguage,
      translate
    );

    let translatedCaptions = [];
    const detectedLanguage = result && result.language ? result.language : null;


    if (translate) {
      translatedCaptions = (result.captions || []).map((s) => ({
        ...s,
        _originalText: s._originalText || s.text,
        text: s.text,
      }));
    } else {
      translatedCaptions = (result.captions || []).map((s) => ({
        ...s,
        text: s.text,
        _originalText: s.text,
      }));
    }

    if (!meetingId) {
      logger.warn("No meetingId provided, captions will not be saved.");
    }
    if (!speaker) {
      logger.warn("No speaker (user) found, captions will not be saved.");
    }

    const filteredCaptions = (translatedCaptions || []).filter(
      (seg) => seg.text && seg.text.trim().length > 2
    );

    if (!filteredCaptions.length) {
      logger.warn("No captions returned from Whisper, nothing to save.");
      return res.json({
        success: true,
        captions: [],
        language: requestedLanguage || detectedLanguage || "en",
      });
    }

    let savedCount = 0;
    for (const segment of filteredCaptions) {
      if (!meetingId || !speaker) continue;
      try {
        const entry = {
          speaker,
          originalText: segment._originalText || segment.text,
          originalLanguage: detectedLanguage || requestedLanguage || "en",
          translations: [],
          confidence: segment.confidence || 0.8,
          timestamp: segment.timestamp
            ? new Date(segment.timestamp)
            : new Date(),
          duration: segment.duration || 0,
          isFinal: segment.isFinal !== undefined ? !!segment.isFinal : true,
        };

        if (segment.text && segment.text !== entry.originalText) {
          entry.translations.push({
            language: requestedLanguage,
            text: segment.text,
            confidence: 0.85,
          });
        }

        await Caption.findOneAndUpdate(
          { meetingId },
          { $push: { captions: entry } },
          { upsert: true, new: true }
        );
        savedCount++;
      } catch (err) {
        logger.error("Error saving caption entry:", err);
      }
    }

    logger.info(`Appended ${savedCount} captions for meetingId=${meetingId}`);

    res.json({
      success: true,
      captions: filteredCaptions,
      language: requestedLanguage || detectedLanguage || "en",
    });
  } catch (error) {
    logger.error("Whisper transcription error:", error);
    res
      .status(500)
      .json({ success: false, message: "Transcription failed", error });
  }
};

export const getMeetingCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language, limit = 50, page = 1 } = req.query;

    const doc = await Caption.findOne({ meetingId }).populate(
      "captions.speaker",
      "name email"
    );
    if (!doc) {
      return res.json({
        success: true,
        captions: [],
        pagination: { page: 1, limit: 0, total: 0 },
      });
    }

    let items = doc.captions || [];
    if (language && language !== "all") {
      items = items.filter(
        (c) =>
          c.originalLanguage === language ||
          (c.translations || []).some((t) => t.language === language)
      );
    }

    items = items
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = items.length;
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const start = (p - 1) * l;
    const paged = items.slice(start, start + l);

    res.json({
      success: true,
      captions: paged,
      pagination: { page: p, limit: l, total },
    });
  } catch (error) {
    logger.error("Get meeting captions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting captions",
    });
  }
};

export const exportCaptions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { language = "original", format = "txt" } = req.query;
    const doc = await Caption.findOne({ meetingId }).populate(
      "captions.speaker",
      "name email"
    );
    const items = doc ? doc.captions || [] : [];

    let content = "";
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "txt") {
      content = `Meeting Captions - ${meetingId}\nExported: ${timestamp}\n\n`;

      items
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .forEach((caption) => {
          const time = new Date(caption.timestamp).toLocaleTimeString();
          const speaker = caption.speaker ? caption.speaker.name : "Unknown";

          let text = caption.originalText;
          if (
            language !== "original" &&
            language !== caption.originalLanguage
          ) {
            const translation = (caption.translations || []).find(
              (t) => t.language === language
            );
            if (translation) text = translation.text;
          }

          content += `[${time}] ${speaker}: ${text}\n`;
        });
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="captions-${meetingId}-${timestamp}.txt"`
    );
    res.send(content);
  } catch (error) {
    logger.error("Export captions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error exporting captions",
    });
  }
};
