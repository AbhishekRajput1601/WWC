import React, { useState, useEffect, Suspense, useRef } from "react";
import axios from "axios";
import Controlbar from "../components/Layout/Controlbar.jsx";
import Meetingheaderbar from "../components/Layout/Meetingheaderbar.jsx";
import io from "socket.io-client";
import meetingService from "../services/meetingService";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Chat = React.lazy(() => import("./Chat.jsx"));
const AllUsers = React.lazy(() => import("./Participants.jsx"));

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:5000";

const MeetingRoom = () => {
    // Disable scrolling on mount, restore on unmount
    useEffect(() => {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, []);
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'users' | null
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Video refs
  const localVideoRef = useRef(null);
  // Media stream state
  const [mediaStream, setMediaStream] = useState(null);
  // Socket and WebRTC
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]); // {socketId, userId, userName}
  const [remoteStreams, setRemoteStreams] = useState({}); // {socketId: MediaStream}
  const peerConnections = useRef({}); // {socketId: RTCPeerConnection}
  const iceServers = useRef(null);

  // End meeting state
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [endMeetingError, setEndMeetingError] = useState("");
  // End Meeting handler
  const handleEndMeeting = async () => {
    setEndingMeeting(true);
    setEndMeetingError("");
    try {
      const result = await meetingService.endMeeting(meetingId);
      if (result.success) {
        setMeetingEnded(true);
        // Optionally update meeting status in state
        setMeeting(result.meeting);
        // Stop media tracks
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
        // Redirect after short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setEndMeetingError(result.message || "Failed to end meeting.");
      }
    } catch (err) {
      setEndMeetingError("Failed to end meeting.");
    }
    setEndingMeeting(false);
  };

  // Control handlers
  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
    setIsMuted((prev) => !prev);
  };
  const toggleVideo = () => {
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !isVideoOn;
        });
      }
      // Always restore srcObject if turning on
      if (!isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      // Always clear srcObject if turning off
      if (isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
    setIsVideoOn((prev) => !prev);
  };
  const toggleCaptions = () => {
    setShowCaptions((prev) => !prev);
  };
  // Real-time audio recording and caption fetching
  useEffect(() => {
    let intervalId;
    if (showCaptions && mediaStream) {
      // Only record audio
      const audioStream = new MediaStream(mediaStream.getAudioTracks());
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else {
        mimeType = '';
      }
      const mediaRecorder = new window.MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        audioChunksRef.current = [];
        // Send audioBlob to backend for transcription
        const formData = new FormData();
        formData.append('audio', audioBlob, mimeType === 'audio/wav' ? 'audio.wav' : 'audio.webm');
        formData.append('language', selectedLanguage);
        formData.append('translate', 'true');
        formData.append('meetingId', meetingId); // <-- Ensure meetingId is sent
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post('/api/whisper/transcribe', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
          });
          if (res.data && res.data.captions && res.data.captions.length > 0) {
            // Show last segment
            setCurrentCaption(res.data.captions[res.data.captions.length - 1].text);
          } else {
            setCurrentCaption('');
            console.error('No captions returned:', res.data);
          }
        } catch (err) {
          setCurrentCaption('');
          console.error('Caption error:', err);
        }
      };

      mediaRecorder.start();
      intervalId = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 6000); // every 6 seconds
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(intervalId);
    };
  }, [showCaptions, mediaStream, selectedLanguage]);
  // Screen sharing logic
  const screenStreamRef = useRef(null);
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        // Replace video track in all peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
        // Replace local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        // Listen for screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
        // Notify others (optional)
        if (socket) socket.emit("start-screen-share");
      } catch (err) {
        // User cancelled or error
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    // Restore camera video track in all peer connections
    if (mediaStream) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(mediaStream.getVideoTracks()[0]);
        }
      });
      // Restore local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    }
    // Notify others (optional)
    if (socket) socket.emit("stop-screen-share");
  };

  useEffect(() => {
    // Listen for screen share events from others
    if (socket) {
      socket.on("user-started-screen-share", ({ socketId }) => {
        // Optionally highlight remote video or show indicator
      });
      socket.on("user-stopped-screen-share", ({ socketId }) => {
        // Optionally remove highlight/indicator
      });
    }
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(false);

    // Start media and connect socket
    let isMounted = true;
    let localStream;
    const startMediaAndSocket = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!isMounted) return;
        setMediaStream(localStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        // Connect socket
        const sock = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
        setSocket(sock);

        // Join meeting
        sock.emit("join-meeting", {
          meetingId,
          userId: user?._id,
          userName: user?.name || "User",
        });

        // ICE servers config
        sock.on("ice-servers", (config) => {
          iceServers.current = config;
        });

        // Existing participants
        sock.on("existing-participants", (existing) => {
          setParticipants(existing);
          // Create peer connections for existing participants
          existing.forEach((p) => {
            createPeerConnection(p.socketId, localStream, sock, true);
          });
        });

        // New user joined
        sock.on("user-joined", (data) => {
          setParticipants((prev) => [...prev, data]);
          createPeerConnection(data.socketId, localStream, sock, true);
        });

        // Offer
        sock.on("offer", async ({ offer, fromSocketId }) => {
          if (!peerConnections.current[fromSocketId]) {
            createPeerConnection(fromSocketId, localStream, sock, false);
          }
          await peerConnections.current[fromSocketId].setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnections.current[
            fromSocketId
          ].createAnswer();
          await peerConnections.current[fromSocketId].setLocalDescription(
            answer
          );
          sock.emit("answer", { answer, targetSocketId: fromSocketId });
        });

        // Answer
        sock.on("answer", async ({ answer, fromSocketId }) => {
          if (peerConnections.current[fromSocketId]) {
            await peerConnections.current[fromSocketId].setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        });

        // ICE candidate
        sock.on("ice-candidate", async ({ candidate, fromSocketId }) => {
          if (peerConnections.current[fromSocketId]) {
            try {
              await peerConnections.current[fromSocketId].addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (e) {}
          }
        });

        // User left
        sock.on("user-left", ({ socketId }) => {
          setParticipants((prev) =>
            prev.filter((p) => p.socketId !== socketId)
          );
          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }
          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });
        });

        // Clean up on leave/disconnect
        sock.on("disconnect", () => {
          Object.values(peerConnections.current).forEach((pc) => pc.close());
          peerConnections.current = {};
          setRemoteStreams({});
        });
      } catch (err) {
        setError(
          "Could not access camera or microphone. Please check permissions."
        );
      }
    };
    startMediaAndSocket();
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (socket) {
        socket.disconnect();
      }
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setRemoteStreams({});
    };
    // eslint-disable-next-line
  }, [authLoading, isAuthenticated, meetingId, navigate, user]);

  // Create peer connection
  const createPeerConnection = (socketId, localStream, sock, isInitiator) => {
    if (peerConnections.current[socketId]) return;
    const pc = new RTCPeerConnection(iceServers.current || {});
    peerConnections.current[socketId] = pc;
    // Add local tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    // Remote stream
    const remoteStream = new MediaStream();
    setRemoteStreams((prev) => ({ ...prev, [socketId]: remoteStream }));
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setRemoteStreams((prev) => ({ ...prev, [socketId]: remoteStream }));
    };
    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sock.emit("ice-candidate", {
          candidate: event.candidate,
          targetSocketId: socketId,
        });
      }
    };
    // If initiator, create offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sock.emit("offer", { offer, targetSocketId: socketId });
        } catch (e) {}
      };
    }
  };

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

  if (meetingEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50">
        <div className="bg-white/90 rounded-2xl shadow-medium p-8 text-center">
          <h2 className="text-2xl font-bold text-success-700 mb-4">
            Meeting Ended
          </h2>
          <p className="text-neutral-700 mb-2">
            The meeting has been successfully ended.
          </p>
          <p className="text-neutral-500 text-sm">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 overflow-hidden relative">
      {/* Meeting Header - Fixed Top Bar */}
      <Meetingheaderbar
        meetingId={meetingId}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        mediaStream={mediaStream}
        socket={socket}
        navigate={navigate}
        isMuted={isMuted}
        user={user}
      />

      <div className="flex-1 flex mt-20">
        {/* Split layout: left for video, right for panel */}
        <div className="flex w-full h-[calc(100vh-96px-72px)]">
          {/* Left: Video Call */}
          <div className="flex-1 flex items-center justify-center bg-transparent h-full">
            <div className="w-[1100px] h-[560px] flex items-center justify-center">
              {/* Local video - Big Screen Perfectly Centered */}
              <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto h-full relative">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-[80vh] object-cover rounded-2xl bg-black shadow-xl border-4 border-white"
                    style={{ maxHeight: "80vh", minHeight: "500px" }}
                  />
                ) : (
                  <div className="w-full h-[80vh] min-h-[500px] flex items-center justify-center rounded-2xl bg-black shadow-xl border-4 border-white">
                    <div className="w-32 h-32 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-6xl">{user?.name?.[0] || "U"}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-6 right-8">
                  <span className="px-4 py-2 bg-white/80 rounded-xl text-lg font-bold text-neutral-900 shadow-lg border border-neutral-300">
                    {user?.name || "You"} (You)
                  </span>
                </div>
                {/* LIVE and Mic status inside user div */}
                <div className="absolute top-4 right-4 flex flex-col items-end space-y-3">
                  <div className="bg-error-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg">
                    <div className="w-3 h-3 rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg ${
                      isMuted
                        ? "bg-neutral-300 text-neutral-700"
                        : "bg-success-100 text-success-700"
                    }`}
                  >
                    {isMuted ? (
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
                          d="M9 19V21a3 3 0 006 0v-2M5 10v2a7 7 0 0014 0v-2M9 5a3 3 0 016 0v6a3 3 0 01-6 0V5zm-4 4l16 16"
                        />
                      </svg>
                    ) : (
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
                          d="M12 1v22m6-6a6 6 0 01-12 0V7a6 6 0 0112 0v10z"
                        />
                      </svg>
                    )}
                    <span>{isMuted ? "Mic Muted" : "Mic On"}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* ...existing code... */}

            {showCaptions && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl z-50">
                <div className="bg-white/95 backdrop-blur-md text-neutral-900 px-6 py-3 rounded-2xl border border-neutral-200 shadow-medium min-h-[48px] flex items-center justify-center">
                  <p className="text-center font-medium">
                    {currentCaption
                      ? currentCaption
                      : <span className="text-neutral-400 italic">Listening...</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Right: Panel (Chat or Participants) */}
         
            {activePanel === "chat" && (
              <Suspense fallback={<div>Loading Chat...</div>}>
                <Chat />
              </Suspense>
            )}
            {activePanel === "users" && (
              <Suspense fallback={<div>Loading Users...</div>}>
                <AllUsers
                  user={user}
                  isMuted={isMuted}
                  participants={participants}
                />
              </Suspense>
            )}
        
        </div>
      </div>

      {/* Control Bar */}
      <Controlbar
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        showCaptions={showCaptions}
        selectedLanguage={selectedLanguage}
        isScreenSharing={isScreenSharing}
        endingMeeting={endingMeeting}
        endMeetingError={endMeetingError}
        toggleMute={toggleMute}
        toggleVideo={toggleVideo}
        toggleCaptions={toggleCaptions}
        setSelectedLanguage={setSelectedLanguage}
        toggleScreenShare={toggleScreenShare}
        handleEndMeeting={handleEndMeeting}
      />
    </div>
  );
}

export default MeetingRoom;
