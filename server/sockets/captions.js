import Caption from "../models/Caption.js";
import logger from "../utils/logger.js";

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
      async ({ meetingId, audioData, userId, language = "en" }) => {
        try {
          const mockTranscription = await simulateTranscription(audioData);

          if (mockTranscription && mockTranscription.text) {
            const caption = await Caption.create({
              meetingId,
              speaker: userId,
              originalText: mockTranscription.text,
              originalLanguage: language,
              confidence: mockTranscription.confidence || 0.8,
              isFinal: mockTranscription.isFinal || false,
            });
            io.to(meetingId).emit("new-caption", {
              captionId: caption._id,
              text: mockTranscription.text,
              speakerId: userId,
              language,
              confidence: mockTranscription.confidence,
              isFinal: mockTranscription.isFinal,
              timestamp: caption.timestamp,
            });

            logger.debug(
              `Caption saved and broadcast for meeting ${meetingId}`
            );
          }
        } catch (error) {
          logger.error("Error processing audio data:", error);
        }
      }
    );

    socket.on("request-translation", async ({ captionId, targetLanguage }) => {
      try {
        const caption = await Caption.findById(captionId);
        if (!caption) {
          return;
        }

        const existingTranslation = caption.translations.find(
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

        caption.translations.push({
          language: targetLanguage,
          text: translatedText,
          confidence: 0.85,
        });
        await caption.save();

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
