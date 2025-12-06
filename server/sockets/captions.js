import Caption from "../models/Caption.js";
import logger from "../utils/logger.js";
import { transcribeAudio } from "../services/captionsWhisperService.js";
import { getSocketUser, setSocketUser } from '../utils/socketMap.js';

export const setupCaptions = (io) => {
  io.on("connection", (socket) => {
    socket.on("start-captions", ({ meetingId, language = "en" }) => {
      logger.info(
        `Starting captions for meeting ${meetingId} in language ${language}`
      );

      socket.join(`captions-${meetingId}`);

      socket.to(meetingId).emit("captions-started", {
        socketId: socket.id,
        language,
      });
    });

    socket.on(
      "audio-data",
      async ({ meetingId, audioData, userId, userName = null, language = "en", translate = false, mimeType = null }) => {
        try {
          if (!meetingId || !audioData) return;

          // map socketId -> user (ensure correct speaker attribution regardless of client-supplied userId)
          let user = getSocketUser(socket.id);

          // Debug: log incoming audio-data payload and current mapping
          try {
            logger.debug('audio-data received', {
              socketId: socket.id,
              payloadUserId: userId,
              payloadUserName: userName,
              mappedUser: user,
            });
          } catch (e) {}

          // If mapping hasn't been set yet (race between audio and join), populate it from payload when available
          if (!user && (userId || userName)) {
            try {
              const newUser = { id: userId || null, name: userName || (userId ? `User-${userId}` : 'User') };
              setSocketUser(socket.id, newUser);
              user = getSocketUser(socket.id);
              logger.debug('socket user mapping populated from audio-data payload', { socketId: socket.id, newUser });
            } catch (e) {
              logger.debug('Failed to set socket user from audio-data payload', e && e.message ? e.message : e);
            }
          }

          const speakerName = (user && user.name) ? user.name : 'Unknown';
          const speakerId = (user && user.id) ? user.id : null;

          // audioData may be an ArrayBuffer (from browser) or Buffer
          const buffer = Buffer.isBuffer(audioData)
            ? audioData
            : Buffer.from(audioData);

          // Call the Whisper transcribe service
          let result = null;
          try {
            result = await transcribeAudio(buffer, language, translate, mimeType);
          } catch (e) {
            logger.error('Whisper transcribe error (socket audio-data):', e && e.message ? e.message : e);
            // fallback: do not crash, just return
            return;
          }

          if (!result || !result.captions || !result.captions.length) {
            return;
          }

          // filter and store only high-confidence, meaningful segments
          for (const seg of result.captions) {
            try {
              const text = (seg.text || "").toString().trim();
              if (!text) continue;

              // confidence from model if provided
              const conf = typeof seg.confidence === 'number' ? seg.confidence : null;

              // simple gibberish filter: require at least 2 letters and alpha ratio
              const letters = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
              const alphaRatio = letters / Math.max(1, text.length);

              const MIN_CONFIDENCE = 0.6;
              const MIN_LETTERS = 2;
              const MIN_ALPHA_RATIO = 0.4;

              const passesConfidence = conf === null ? true : conf >= MIN_CONFIDENCE;
              const passesGibberish = letters >= MIN_LETTERS && alphaRatio >= MIN_ALPHA_RATIO;

              if (!passesConfidence || !passesGibberish) {
                logger.debug('Rejected caption (low confidence or gibberish)', { text, confidence: conf, letters, alphaRatio });
                continue;
              }

              const entry = {
                speaker: speakerId || undefined,
                speakerName: speakerName,
                originalText: text,
                originalLanguage: result.language || language || "en",
                translations: [],
                confidence: conf || 0.85,
                timestamp: new Date(),
                duration: (seg.end && seg.start) ? Math.max(0, seg.end - seg.start) : 0,
                isFinal: true,
              };

              const updated = await Caption.findOneAndUpdate(
                { meetingId },
                { $push: { captions: entry } },
                { upsert: true, new: true }
              );

              const appended = updated.captions && updated.captions.length ? updated.captions[updated.captions.length - 1] : null;

              io.to(meetingId).emit("new-caption", {
                captionId: appended?._id || null,
                text: text,
                speakerId: speakerId || null,
                speakerName: speakerName,
                language: result.language || language || "en",
                confidence: entry.confidence,
                isFinal: entry.isFinal,
                timestamp: appended ? appended.timestamp : entry.timestamp,
              });

              logger.debug(`Caption appended and broadcast for meeting ${meetingId}`);
            } catch (err) {
              logger.error('Error saving caption segment:', err);
            }
          }
        } catch (error) {
          logger.error("Error processing audio data:", error);
        }
      }
    );

    socket.on("request-translation", async ({ captionId, targetLanguage }) => {
      try {
        const doc = await Caption.findOne({ 'captions._id': captionId });
        if (!doc) return;

        const caption = doc.captions.id(captionId);
        if (!caption) return;

        const existingTranslation = (caption.translations || []).find(
          (t) => t.language === targetLanguage
        );

        if (existingTranslation) {
          socket.emit("translation-result", {
            captionId,
            language: targetLanguage,
            text: existingTranslation.text,
            confidence: existingTranslation.confidence,
          });
          return;
        }

        const translatedText = await simulateTranslation(
          caption.originalText,
          targetLanguage
        );

        caption.translations = caption.translations || [];
        caption.translations.push({ language: targetLanguage, text: translatedText, confidence: 0.85 });

        await doc.save();

        socket.emit("translation-result", {
          captionId,
          language: targetLanguage,
          text: translatedText,
          confidence: 0.85,
        });
      } catch (error) {
        logger.error("Error translating caption:", error);
      }
    });

    socket.on("stop-captions", ({ meetingId }) => {
      socket.leave(`captions-${meetingId}`);
      socket.to(meetingId).emit("captions-stopped", {
        socketId: socket.id,
      });
    });
  });
};

const simulateTranscription = async (audioData) => {
  if (Math.random() > 0.7) {
    const mockPhrases = [
      "Hello everyone, welcome to the meeting",
      "Can you hear me clearly?",
      "Let's discuss the project timeline",
      "I think we should focus on the main features",
      "Does anyone have questions?",
      "Thank you for your attention",
    ];
    return {
      text: mockPhrases[Math.floor(Math.random() * mockPhrases.length)],
      confidence: 0.8 + Math.random() * 0.2,
      isFinal: Math.random() > 0.3,
    };
  }

  return null;
};

const simulateTranslation = async (text, targetLanguage) => {
  const translations = {
    es: {
      // Spanish
      "Hello everyone, welcome to the meeting":
        "Hola a todos, bienvenidos a la reunión",
      "Can you hear me clearly?": "¿Pueden escucharme claramente?",
      "Let's discuss the project timeline":
        "Discutamos el cronograma del proyecto",
      "I think we should focus on the main features":
        "Creo que deberíamos centrarnos en las características principales",
      "Does anyone have questions?": "¿Alguien tiene preguntas?",
      "Thank you for your attention": "Gracias por su atención",
    },
    fr: {
      // French
      "Hello everyone, welcome to the meeting":
        "Bonjour tout le monde, bienvenue à la réunion",
      "Can you hear me clearly?": "Pouvez-vous m'entendre clairement?",
      "Let's discuss the project timeline": "Discutons du calendrier du projet",
      "I think we should focus on the main features":
        "Je pense que nous devrions nous concentrer sur les principales fonctionnalités",
      "Does anyone have questions?": "Est-ce que quelqu'un a des questions?",
      "Thank you for your attention": "Merci pour votre attention",
    },
  };

  if (translations[targetLanguage] && translations[targetLanguage][text]) {
    return translations[targetLanguage][text];
  }

  return `[${targetLanguage}] ${text}`;
};
