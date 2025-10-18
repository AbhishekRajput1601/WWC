import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Meeting controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Video refs
  const localVideoRef = React.useRef(null);
  
  // Mock participants data
  const [participants] = useState([
    { id: 1, name: 'John Doe', isMuted: false, isVideoOff: false },
    { id: 2, name: 'Jane Smith', isMuted: true, isVideoOff: false },
    { id: 3, name: 'Mike Johnson', isMuted: false, isVideoOff: true },
  ]);

  // Control handlers
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleCaptions = () => setShowCaptions(!showCaptions);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
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
  }, [authLoading, isAuthenticated, meetingId, navigate, user]);

  // Handle chat message send
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: Date.now(),
        sender: user?.name || 'You',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-3xl flex items-center justify-center shadow-hard mb-6">
            <div className="animate-pulse-soft">
              <span className="text-white font-bold text-2xl font-display">W</span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-500 mx-auto mb-4"></div>
          <p className="text-neutral-900 font-semibold text-lg">Connecting to WWC Meeting...</p>
          <p className="text-neutral-600 text-sm mt-1">Meeting ID: {meetingId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-error-950 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-error-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Connection Failed</h2>
          <p className="text-neutral-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-wwc-600 to-wwc-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-wwc-700 hover:to-wwc-800 transition-all duration-200 shadow-soft hover:shadow-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 overflow-hidden">
      {/* Meeting Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-neutral-200 px-6 py-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* WWC Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg font-display">W</span>
              </div>
              <div>
                <h1 className="text-neutral-900 font-bold text-lg font-display">WWC Meeting</h1>
                <p className="text-neutral-600 text-sm font-mono">ID: {meetingId}</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 bg-success-100 border border-success-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-success-700 text-sm font-medium">Connected</span>
            </div>
            
            {/* Participants Count */}
            <div className="flex items-center space-x-2 text-neutral-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM7 20a3 3 0 015.196-2.121M15 6a3 3 0 106 0 3 3 0 00-6 0z" />
              </svg>
              <span className="font-medium">{participants.length + 1} participants</span>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border-2 border-black ${
                showParticipants 
                ? 'bg-gray-200 text-black shadow-soft' 
                : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM7 20a3 3 0 015.196-2.121M15 6a3 3 0 106 0 3 3 0 00-6 0z" />
                </svg>
                <span>Participants</span>
              </div>
            </button>
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 relative border-2 border-black ${
                showChat 
                ? 'bg-gray-200 text-black shadow-soft' 
                : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat</span>
              </div>
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{messages.length}</span>
                </div>
              )}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black border-2 border-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Meeting</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className={`transition-all duration-300 ${showParticipants || showChat ? 'flex-1' : 'w-full'}`}>
          {/* Video Grid */}
          <div className="p-6 h-full">
            <div className="grid gap-3 h-full" style={{
              gridTemplateColumns: participants.length === 0 ? '1fr' : 
                                 participants.length <= 1 ? 'repeat(3, 1fr)' :
                                 participants.length <= 3 ? 'repeat(3, 1fr)' :
                                 'repeat(4, 1fr)',
              gridTemplateRows: participants.length <= 1 ? '300px' :
                              participants.length <= 3 ? 'repeat(2, 250px)' :
                              'repeat(2, 200px)'
            }}>
              {/* Local Video - Smaller size */}
              <div className={`relative bg-white rounded-xl overflow-hidden shadow-medium border border-neutral-200 h-60 ${
                participants.length === 0 ? 'col-span-2 h-80' : ''
              }`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Video Name Label - Always visible */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-medium shadow-lg">
                    <span className="text-success-400">●</span> {user?.name || 'You'} (Host)
                  </div>
                </div>

                {/* Video Controls Overlay - Show on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    {!isMuted ? (
                      <div className="w-8 h-8 bg-success-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-error-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
                        </svg>
                      </div>
                    )}
                    {isVideoOn ? (
                      <div className="w-8 h-8 bg-success-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-error-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Live Indicator */}
                <div className="absolute top-4 right-4">
                  <div className="bg-error-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                </div>
              </div>

              {/* Remote Videos */}
              {participants.map((participant, index) => (
                <div key={participant.id} className="relative bg-white rounded-xl overflow-hidden shadow-medium border border-neutral-200 h-60">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    srcObject={participant.stream}
                  />
                  
                  {/* Participant Name Label - Always visible */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-medium shadow-lg">
                      {participant.name || `Participant ${index + 1}`}
                    </div>
                  </div>
                  
                  {/* Participant Status Icons - Always visible */}
                  {participant.isMuted && (
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-error-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty Slots with Modern Design */}
              {Array.from({ length: Math.max(0, 5 - participants.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors duration-200 h-60">
                  <div className="text-neutral-500 text-center">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Waiting for participant</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Captions Overlay */}
          {showCaptions && currentCaption && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl">
              <div className="bg-white/95 backdrop-blur-md text-neutral-900 px-6 py-3 rounded-2xl border border-neutral-200 shadow-medium">
                <p className="text-center font-medium">{currentCaption}</p>
              </div>
            </div>
          )}
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-white border-l border-neutral-200 flex flex-col shadow-medium">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-display">Participants ({participants.length + 1})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Host (You) */}
              <div className="flex items-center justify-between p-3 bg-wwc-50 rounded-xl border border-wwc-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{user?.name?.[0] || 'U'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{user?.name || 'You'}</p>
                    <p className="text-xs text-wwc-600 font-medium">Host</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!isMuted ? (
                    <div className="w-6 h-6 bg-success-600 rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-error-600 rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Participants */}
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{participant.name?.[0] || `P${index + 1}`}</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{participant.name || `Participant ${index + 1}`}</p>
                      <p className="text-xs text-neutral-500">Member</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {participant.isMuted && (
                      <div className="w-6 h-6 bg-error-600 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-white border-l border-neutral-200 flex flex-col shadow-medium">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-display">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500 text-sm">No messages yet</p>
                  <p className="text-neutral-400 text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">{message.sender?.[0] || 'U'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{message.sender}</p>
                      <p className="text-sm text-neutral-700 mt-1">{message.text}</p>
                      <p className="text-xs text-neutral-400 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-neutral-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border-2 border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-white shadow-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-white text-black border-2 border-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-6 py-4 shadow-hard">
        <div className="flex items-center justify-center space-x-6">
          {/* Microphone Toggle */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-2xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              isMuted 
                ? 'bg-gray-200 text-black' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>
          
          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-2xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              !isVideoOn 
                ? 'bg-gray-200 text-black' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOn ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              )}
            </svg>
          </button>

          {/* Captions Toggle */}
          <button
            onClick={toggleCaptions}
            className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              showCaptions 
                ? 'bg-gray-200 text-black' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2M7 4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1M7 4h10M9 12h6m-6 4h6" />
              </svg>
              <span>{showCaptions ? 'Hide Captions' : 'Show Captions'}</span>
            </div>
          </button>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-neutral-700">Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-2xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              isScreenSharing 
                ? 'bg-gray-200 text-black' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
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