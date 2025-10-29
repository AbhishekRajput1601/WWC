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
import fileUpload from 'express-fileupload';
import { setupSignaling } from './sockets/signaling.js';
import { setupCaptions } from './sockets/captions.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5174",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whisper', whisperRoutes);


// Socket.IO setup
setupSignaling(io);
setupCaptions(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});