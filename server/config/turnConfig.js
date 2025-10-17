// TURN server configuration for WebRTC
export const turnConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    },
    // Add TURN server configuration here if you have one
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password'
    // }
  ]
};