import logger from "../utils/logger.js";
import { turnConfig } from "../config/turnConfig.js";
import Meeting from "../models/Meeting.js";

const activeMeetings = new Map(); // meetingId -> Set of socket IDs
const socketToMeeting = new Map(); // socketId -> meetingId
// socketToUser moved to shared socketMap util
import { setSocketUser, removeSocketUser, getSocketUser } from '../utils/socketMap.js';

export const setupSignaling = (io) => {
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join-meeting", ({ meetingId, userId, userName }) => {
      logger.info(`User ${userName} (${userId}) joining meeting: ${meetingId}`);

      socket.join(meetingId);
      socketToMeeting.set(socket.id, meetingId);
      setSocketUser(socket.id, { id: userId, name: userName });

      if (!activeMeetings.has(meetingId)) {
        activeMeetings.set(meetingId, new Set());
      }
      activeMeetings.get(meetingId).add(socket.id);

      socket.to(meetingId).emit("user-joined", {
        userId,
        userName,
        socketId: socket.id,
      });

      socket.emit("ice-servers", turnConfig);

      const existingParticipants = [];
      activeMeetings.get(meetingId).forEach((socketId) => {
        if (socketId !== socket.id) {
          const user = getSocketUser(socketId);
          if (user) {
            existingParticipants.push({
              socketId,
              userId: user.id,
              userName: user.name,
            });
          }
        }
      });

      socket.emit("existing-participants", existingParticipants);

      // Send last 100 chat messages as history
      Meeting.findOne({ meetingId })
        .select({ messages: { $slice: -100 } })
        .lean()
        .then((doc) => {
          const history = (doc?.messages || []).map((m) => ({
            senderId: m.sender?.toString?.() || null,
            senderName: m.senderName || "User",
            text: m.text,
            timestamp: new Date(m.timestamp).getTime(),
          }));
          socket.emit("chat-history", history);
        })
        .catch((err) => {
          logger.error("Failed to load chat history", err?.message || err);
        });
    });

    socket.on("get-chat-history", () => {
      const meetingId = socketToMeeting.get(socket.id);
      if (!meetingId) return;
      Meeting.findOne({ meetingId })
        .select({ messages: { $slice: -100 } })
        .lean()
        .then((doc) => {
          const history = (doc?.messages || []).map((m) => ({
            senderId: m.sender?.toString?.() || null,
            senderName: m.senderName || "User",
            text: m.text,
            timestamp: new Date(m.timestamp).getTime(),
          }));
          socket.emit("chat-history", history);
        })
        .catch((err) => {
          logger.error(
            "Failed to load chat history (on-demand)",
            err?.message || err
          );
        });
    });

    socket.on("send-chat-message", async ({ text }) => {
      const meetingId = socketToMeeting.get(socket.id);
      const user = getSocketUser(socket.id);
      if (!meetingId || !text || !text.trim()) return;

      const payload = {
        senderId: user?.id,
        senderName: user?.name || "User",
        text: String(text),
        timestamp: Date.now(),
      };

      try {
        await Meeting.updateOne(
          { meetingId },
          {
            $push: {
              messages: {
                sender: user?.id || undefined,
                senderName: payload.senderName,
                text: payload.text,
                timestamp: new Date(payload.timestamp),
              },
            },
          }
        ).exec();
      } catch (err) {
        logger.error("Failed to persist chat message", err?.message || err);
      }

      io.to(meetingId).emit("chat-message", payload);
      logger.debug(
        `Chat in ${meetingId} from ${user?.name || socket.id}: ${text}`
      );
    });

    socket.on("offer", ({ offer, targetSocketId }) => {
      logger.debug(`Offer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit("offer", {
        offer,
        fromSocketId: socket.id,
      });
    });

    socket.on("answer", ({ answer, targetSocketId }) => {
      logger.debug(`Answer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit("answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on("ice-candidate", ({ candidate, targetSocketId }) => {
      logger.debug(`ICE candidate from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit("ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    socket.on("toggle-audio", ({ isEnabled }) => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit("user-audio-toggle", {
          socketId: socket.id,
          isEnabled,
        });
      }
    });

    socket.on("toggle-video", ({ isEnabled }) => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit("user-video-toggle", {
          socketId: socket.id,
          isEnabled,
        });
      }
    });

    socket.on("start-screen-share", () => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit("user-started-screen-share", {
          socketId: socket.id,
        });
      }
    });

    socket.on("stop-screen-share", () => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit("user-stopped-screen-share", {
          socketId: socket.id,
        });
      }
    });

    socket.on("leave-meeting", () => {
      handleUserLeave(socket);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      handleUserLeave(socket);
    });
  });

  const handleUserLeave = (socket) => {
    const meetingId = socketToMeeting.get(socket.id);
    const user = getSocketUser(socket.id);

    if (meetingId && user) {
      if (activeMeetings.has(meetingId)) {
        activeMeetings.get(meetingId).delete(socket.id);
        if (activeMeetings.get(meetingId).size === 0) {
          activeMeetings.delete(meetingId);
        }
      }

      socket.to(meetingId).emit("user-left", {
        socketId: socket.id,
        userId: user.id,
        userName: user.name,
      });

      socketToMeeting.delete(socket.id);
      removeSocketUser(socket.id);

      logger.info(`User ${user.name} left meeting: ${meetingId}`);
    }
  };
};
