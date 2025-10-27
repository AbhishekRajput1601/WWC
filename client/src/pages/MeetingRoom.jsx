import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Chat = React.lazy(() => import("./Chat.jsx"));
const AllUsers = React.lazy(() => import("./AllUsers.jsx"));

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Meeting controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'users' | null
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Video refs
  const localVideoRef = React.useRef(null);
  // Media stream state
  const [mediaStream, setMediaStream] = useState(null);

  // No dummy participants

  // Control handlers
  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };
  const toggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn(!isVideoOn);
  };
  const toggleCaptions = () => setShowCaptions(!showCaptions);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setLoading(false);

    // Request camera and microphone access when joining meeting
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Could not access camera or microphone. Please check permissions.');
      }
    };
    startMedia();
  }, [authLoading, isAuthenticated, meetingId, navigate, user]);

  // Handle chat message send
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now(),
          sender: user?.name || "You",
          text: newMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setNewMessage("");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-3xl flex items-center justify-center shadow-hard mb-6">
            <div className="animate-pulse-soft">
              <span className="text-white font-bold text-2xl font-display">
                W
              </span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-500 mx-auto mb-4"></div>
          <p className="text-neutral-900 font-semibold text-lg">
            Connecting to WWC Meeting...
          </p>
          <p className="text-neutral-600 text-sm mt-1">
            Meeting ID: {meetingId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-error-950 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-error-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Connection Failed
          </h2>
          <p className="text-neutral-300 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-wwc-600 to-wwc-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-wwc-700 hover:to-wwc-800 transition-all duration-200 shadow-soft hover:shadow-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 overflow-hidden relative">
      {/* Meeting Header - Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-200 px-6 py-4 shadow-soft">
        <div className="flex items-center justify-between">
  <div className="flex items-center space-x-6 ml-32">
            {/* WWC Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg font-display">
                  W
                </span>
              </div>
              <div>
                <h1 className="text-neutral-900 font-bold text-lg font-display">
                  WWC Meeting
                </h1>
                <p className="text-neutral-600 text-sm font-mono">
                  ID: {meetingId}
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2 bg-success-100 border border-success-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-success-700 text-sm font-medium">
                Connected
              </span>
            </div>

            {/* Participants Count removed (no dummy users) */}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-5 ml-96 mr-36">
            <button
              onClick={() => setActivePanel(activePanel === 'users' ? null : 'users')}
              className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 border-2 border-black text-sm flex items-center space-x-1 ${activePanel === 'users' ? "bg-gray-200 text-black shadow-soft" : "bg-white text-black hover:bg-gray-200"}`}
            >
              <svg className="w-6 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM7 20a3 3 0 015.196-2.121M15 6a3 3 0 106 0 3 3 0 00-6 0z" />
              </svg>
              <span>All Users</span>
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 border-2 border-black text-sm flex items-center space-x-1 ${activePanel === 'chat' ? "bg-gray-200 text-black shadow-soft" : "bg-white text-black hover:bg-gray-200"}`}
            >
              <svg className="w-6 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat</span>
            </button>
            <button
              onClick={() => {
                // Stop camera and mic
                if (mediaStream) {
                  mediaStream.getTracks().forEach(track => track.stop());
                }
                navigate("/dashboard");
              }}
              className="bg-white text-black border-2 border-black px-2 py-1 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium text-sm flex items-center space-x-1"
            >
              <svg className="w-6 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

  <div className="flex-1 flex mt-20">
        {/* Main Video Area - non-scrollable, fills space between header and control bar */}
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 96px - 72px)' }}>
          <div className="relative bg-white rounded-xl overflow-hidden shadow-medium border border-neutral-200 max-w-4xl w-full mx-auto" style={{ aspectRatio: '16/9' }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-medium shadow-lg">
                <span className="text-success-400">●</span>{" "}
                {user?.name || "You"} (Host)
              </div>
            </div>
            <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
              <div className="bg-error-500 text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
                <div className="w-2 h-2 rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg ${isMuted ? 'bg-neutral-300 text-neutral-700' : 'bg-success-100 text-success-700'}`}>
                {isMuted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V21a3 3 0 006 0v-2M5 10v2a7 7 0 0014 0v-2M9 5a3 3 0 016 0v6a3 3 0 01-6 0V5zm-4 4l16 16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m6-6a6 6 0 01-12 0V7a6 6 0 0112 0v10z" />
                  </svg>
                )}
                <span>{isMuted ? 'Mic Muted' : 'Mic On'}</span>
              </div>
            </div>
          </div>
          {showCaptions && currentCaption && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl">
              <div className="bg-white/95 backdrop-blur-md text-neutral-900 px-6 py-3 rounded-2xl border border-neutral-200 shadow-medium">
                <p className="text-center font-medium">{currentCaption}</p>
              </div>
            </div>
          )}
        </div>
        {/* Conditionally render Chat or AllUsers panel */}
        {activePanel === 'chat' && (
          <Suspense fallback={<div>Loading Chat...</div>}>
            <Chat />
          </Suspense>
        )}
        {activePanel === 'users' && (
          <Suspense fallback={<div>Loading Users...</div>}>
            <AllUsers user={user} isMuted={isMuted} />
          </Suspense>
        )}
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-6 py-4 shadow-hard">
        <div className="flex items-center justify-center space-x-4">
          {/* Microphone Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              isMuted
                ? "bg-gray-200 text-black"
                : "bg-white text-black hover:bg-gray-200"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMuted ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              )}
            </svg>
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              !isVideoOn
                ? "bg-gray-200 text-black"
                : "bg-white text-black hover:bg-gray-200"
            }`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isVideoOn ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              )}
            </svg>
          </button>

          {/* Captions Toggle */}
          <button
            onClick={toggleCaptions}
            className={`px-3 py-2 rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              showCaptions
                ? "bg-gray-200 text-black"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center space-x-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2M7 4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1M7 4h10M9 12h6m-6 4h6"
                />
              </svg>
              <span className="text-sm">{showCaptions ? "Hide" : "Show"}</span>
            </div>
          </button>

          {/* Language Selector */}
          <div className="flex items-center space-x-1">
            <label className="text-xs font-medium text-neutral-700">
              Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white border border-neutral-200 text-neutral-900 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 text-xs"
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
            className={`p-2 rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
              isScreenSharing
                ? "bg-gray-200 text-black"
                : "bg-white text-black hover:bg-gray-200"
            }`}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
