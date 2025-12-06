const socketUserMap = new Map(); // socketId -> { id, name }

export const setSocketUser = (socketId, user) => {
  try {
    socketUserMap.set(socketId, user);
  } catch (e) {}
};

export const getSocketUser = (socketId) => {
  return socketUserMap.get(socketId) || null;
};

export const removeSocketUser = (socketId) => {
  socketUserMap.delete(socketId);
};

export default {
  setSocketUser,
  getSocketUser,
  removeSocketUser,
};
