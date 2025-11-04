import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

console.log(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL);

async function checkLiveKitServer() {
  try {
    const client = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const rooms = await client.listRooms();
    console.log('[LiveKit Status] Server is reachable. Room count:', rooms.length);
    return true;
  } catch (err) {
    console.error('[LiveKit Status] Server is NOT reachable:', err.message);
    return false;
  }
}

checkLiveKitServer();
