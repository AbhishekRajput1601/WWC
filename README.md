# ZoomClone - Video Conference with Real-time Captions & Translation

A full-stack video conferencing application with real-time speech-to-text captions and multi-language translation capabilities.

## 🚀 Features

- **HD Video Calls**: WebRTC-powered video conferencing
- **Real-time Captions**: Automatic speech-to-text transcription
- **Multi-language Translation**: Instant caption translation
- **User Authentication**: Secure JWT-based auth system
- **Meeting Management**: Create, join, and manage meetings
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **WebRTC** for peer-to-peer video calls
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time events
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing

### Additional Services (Optional)
- **Google Cloud Speech-to-Text** (configurable)
- **Azure Speech Services** (configurable)
- **Google Translate API** (configurable)
- **TURN/STUN servers** for WebRTC

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Already in your wwc directory
cd server
npm install

cd ../client
npm install
```

### 2. Environment Configuration

**Server (.env in root):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zoom-clone
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5174
```

**Client (client/.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```

Or use MongoDB Atlas cloud service.

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5174
- Backend API: http://localhost:5000

## 🎯 How to Use

1. **Sign Up/Login**: Create an account or log in
2. **Dashboard**: View your meetings and create new ones
3. **Create Meeting**: Start a new meeting with custom settings
4. **Join Meeting**: Enter a meeting ID to join existing meetings
5. **Video Call**: Enable camera/microphone for video communication
6. **Captions**: Enable real-time speech-to-text captions
7. **Translation**: Select target language for caption translation

## 📱 Core Components

### Frontend Structure
```
client/src/
├── components/
│   ├── Auth/           # Login/Signup components
│   ├── Meeting/        # Video call components
│   └── Layout/         # Navigation and layout
├── pages/              # Main pages
├── context/            # React context (Auth)
├── hooks/              # Custom React hooks
└── utils/              # API utilities
```

### Backend Structure
```
server/
├── config/             # Database and environment config
├── controllers/        # Route handlers
├── middleware/         # Auth middleware
├── models/             # MongoDB schemas
├── routes/             # API routes
├── services/           # External service integrations
├── sockets/            # Socket.IO event handlers
└── utils/              # Utility functions
```

## 🔧 Configuration Options

### WebRTC Configuration
The app uses Google's STUN servers by default. For production, configure TURN servers in `server/config/turnConfig.js`.

### Speech Recognition
- **Development**: Uses mock transcription for demo
- **Production**: Configure Google Cloud Speech-to-Text or Azure Speech in `server/services/asrService.js`

### Translation Services
- **Development**: Uses mock translation
- **Production**: Configure Google Translate API or Azure Translator

## 🚀 Deployment

### Frontend (Vite Build)
```bash
cd client
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend (Node.js)
```bash
cd server
npm start
# Deploy to your Node.js hosting platform
```

### Environment Variables for Production
Update your production environment with:
- Secure JWT_SECRET
- Production MongoDB URI
- API keys for speech and translation services
- TURN server configuration

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation
- Protected API routes

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
- Ensure MongoDB is running locally or check cloud connection string

**2. WebRTC Connection Issues**
- Check firewall settings
- Configure TURN servers for production

**3. Captions Not Working**
- Speech recognition requires HTTPS in production
- Configure proper API keys for production services

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.IO for real-time events
- React and Node.js communities
- All open-source contributors

---

**Note**: This is a demonstration project. For production use, implement proper security measures, configure real speech-to-text services, and set up proper TURN servers for WebRTC.