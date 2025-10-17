import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // In a complete implementation, this would:
    // 1. Fetch meeting details
    // 2. Join the meeting via API
    // 3. Initialize WebRTC connections
    // 4. Set up Socket.IO for signaling
    // 5. Initialize video/audio streams
    setLoading(false);
  }, [isAuthenticated, meetingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Meeting Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Meeting Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold">Meeting: {meetingId}</h1>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-sm">Connected</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Leave Meeting
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Main Video (Self) */}
          <div className="bg-gray-800 rounded-lg relative overflow-hidden">
            <video 
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute bottom-4 left-4 text-white font-semibold">
              {user?.name} (You)
            </div>
            <div className="absolute top-4 right-4">
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                LIVE
              </span>
            </div>
          </div>

          {/* Placeholder for other participants */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl text-gray-400">👤</span>
                </div>
                <p className="text-gray-400 text-sm">Waiting for participants...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Captions Overlay */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-4">
        <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg">
          <p className="text-center">
            Real-time captions will appear here...
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 py-3 font-semibold">
            Enable Captions
          </button>

          <select className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>

          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;