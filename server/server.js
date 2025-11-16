import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import captionRoutes from './routes/captionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import whisperRoutes from './routes/whisperRoutes.js';
import { setupSignaling } from './sockets/signaling.js';
import { setupCaptions } from './sockets/captions.js';
import { setIO } from './utils/socket.js';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5174",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whisper', whisperRoutes);


// make the io instance available to controllers/services that need to emit
setIO(io);

setupSignaling(io);
setupCaptions(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});