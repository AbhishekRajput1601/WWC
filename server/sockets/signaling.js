import logger from '../utils/logger.js';
import { turnConfig } from '../config/turnConfig.js';

const activeMeetings = new Map(); // meetingId -> Set of socket IDs
const socketToMeeting = new Map(); // socketId -> meetingId
const socketToUser = new Map(); // socketId -> userId

export const setupSignaling = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-meeting', ({ meetingId, userId, userName }) => {
      logger.info(`User ${userName} (${userId}) joining meeting: ${meetingId}`);
      
      socket.join(meetingId);
      socketToMeeting.set(socket.id, meetingId);
      socketToUser.set(socket.id, { id: userId, name: userName });

      if (!activeMeetings.has(meetingId)) {
        activeMeetings.set(meetingId, new Set());
      }
      activeMeetings.get(meetingId).add(socket.id);

      socket.to(meetingId).emit('user-joined', {
        userId,
        userName,
        socketId: socket.id
      });

      socket.emit('ice-servers', turnConfig);

      const existingParticipants = [];
      activeMeetings.get(meetingId).forEach(socketId => {
        if (socketId !== socket.id) {
          const user = socketToUser.get(socketId);
          if (user) {
            existingParticipants.push({
              socketId,
              userId: user.id,
              userName: user.name
            });
          }
        }
      });

      socket.emit('existing-participants', existingParticipants);
    });

    socket.on('offer', ({ offer, targetSocketId }) => {
      logger.debug(`Offer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit('offer', {
        offer,
        fromSocketId: socket.id
      });
    });

    socket.on('answer', ({ answer, targetSocketId }) => {
      logger.debug(`Answer from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit('answer', {
        answer,
        fromSocketId: socket.id
      });
    });

    socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
      logger.debug(`ICE candidate from ${socket.id} to ${targetSocketId}`);
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromSocketId: socket.id
      });
    });

    socket.on('toggle-audio', ({ isEnabled }) => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit('user-audio-toggle', {
          socketId: socket.id,
          isEnabled
        });
      }
    });

    socket.on('toggle-video', ({ isEnabled }) => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit('user-video-toggle', {
          socketId: socket.id,
          isEnabled
        });
      }
    });

    socket.on('start-screen-share', () => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit('user-started-screen-share', {
          socketId: socket.id
        });
      }
    });

    socket.on('stop-screen-share', () => {
      const meetingId = socketToMeeting.get(socket.id);
      if (meetingId) {
        socket.to(meetingId).emit('user-stopped-screen-share', {
          socketId: socket.id
        });
      }
    });

    socket.on('leave-meeting', () => {
      handleUserLeave(socket);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      handleUserLeave(socket);
    });
  });

  const handleUserLeave = (socket) => {
    const meetingId = socketToMeeting.get(socket.id);
    const user = socketToUser.get(socket.id);

    if (meetingId && user) {

      if (activeMeetings.has(meetingId)) {
        activeMeetings.get(meetingId).delete(socket.id);
        if (activeMeetings.get(meetingId).size === 0) {
          activeMeetings.delete(meetingId);
        }
      }

  
      socket.to(meetingId).emit('user-left', {
        socketId: socket.id,
        userId: user.id,
        userName: user.name
      });


      socketToMeeting.delete(socket.id);
      socketToUser.delete(socket.id);

      logger.info(`User ${user.name} left meeting: ${meetingId}`);
    }
  };
};