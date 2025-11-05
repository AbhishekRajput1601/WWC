// TURN server configuration for WebRTC
export const turnConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    },
  
    // {
    //   urls: 'turn:turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ]
};