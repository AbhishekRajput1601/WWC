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
  const VideoTile = ({ stream, label, isLocal = false, avatarChar = 'U' }) => {
    const ref = React.useRef(null);
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (el) {
        el.srcObject = stream || null;
      }

      const computeHasVideo = () => {
        if (!stream) return false;
        const v = stream.getVideoTracks();
        if (!v.length) return false;
        const t = v[0];
        if (isLocal) {
          return t.readyState === 'live' && t.enabled !== false;
        }
        return t.readyState === 'live' && t.muted === false;
      };

      const update = () => setHasVideo(computeHasVideo());

      update();

      if (stream) {
        const onAdd = () => update();
        const onRemove = () => update();
        const track = stream.getVideoTracks()[0];
        const onMute = () => update();
        const onUnmute = () => update();
        const onEnded = () => update();
        stream.addEventListener?.('addtrack', onAdd);
        stream.addEventListener?.('removetrack', onRemove);
        track?.addEventListener?.('mute', onMute);
        track?.addEventListener?.('unmute', onUnmute);
        track?.addEventListener?.('ended', onEnded);
        return () => {
          stream.removeEventListener?.('addtrack', onAdd);
          stream.removeEventListener?.('removetrack', onRemove);
          track?.removeEventListener?.('mute', onMute);
          track?.removeEventListener?.('unmute', onUnmute);
          track?.removeEventListener?.('ended', onEnded);
        };
      }
    }, [stream]);

    return (
      <div className="relative bg-black rounded-2xl border-4 border-white shadow-xl overflow-hidden w-full h-full min-h-[220px]">
        <video
          ref={ref}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          muted={isLocal}
        />
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-4xl">{avatarChar}</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/85 text-neutral-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow">
          {label}
        </div>
      </div>
    );
  };
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

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [activePanel, setActivePanel] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);

  const [mediaStream, setMediaStream] = useState(null);
 
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); 
  const peerConnections = useRef({}); 
  const iceServers = useRef(null);
  const [selfSocketId, setSelfSocketId] = useState(null);

  const [endingMeeting, setEndingMeeting] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [endMeetingError, setEndMeetingError] = useState("");

  const handleEndMeeting = async () => {
    setEndingMeeting(true);
    setEndMeetingError("");
    try {
      const result = await meetingService.endMeeting(meetingId);
      if (result.success) {
        setMeetingEnded(true);
    
        setMeeting(result.meeting);
 
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
    
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

      if (!isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
  
      if (isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
    setIsVideoOn((prev) => !prev);
  };
  const toggleCaptions = () => {
    setShowCaptions((prev) => !prev);
  };

  useEffect(() => {
    let intervalId;
    if (showCaptions && mediaStream) {
   
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
        const formData = new FormData();
        formData.append('audio', audioBlob, mimeType === 'audio/wav' ? 'audio.wav' : 'audio.webm');
        formData.append('language', selectedLanguage);
        formData.append('translate', selectedLanguage !== 'en' ? 'true' : 'false');
        formData.append('meetingId', meetingId); 
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post('/api/whisper/transcribe', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
          });
          if (res.data && res.data.captions && res.data.captions.length > 0) {
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
      }, 2000);
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(intervalId);
    };
  }, [showCaptions, mediaStream, selectedLanguage]);

  const screenStreamRef = useRef(null);
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
       
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
  
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
   
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      
        if (socket) socket.emit("start-screen-share");
      } catch (err) {
        console.error("Error starting screen share:", err);
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
   
    if (mediaStream) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(mediaStream.getVideoTracks()[0]);
        }
      });
   
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    }
  
    if (socket) socket.emit("stop-screen-share");
  };

  useEffect(() => {
  
    if (socket) {
      socket.on("user-started-screen-share", ({ socketId }) => {
   
      });
      socket.on("user-stopped-screen-share", ({ socketId }) => {
     
      });
    }
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(false);

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
  
        const sock = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
        setSocket(sock);
        // Capture our own socket id so we can filter ourselves from remote lists
        sock.on("connect", () => {
          setSelfSocketId(sock.id);
        });


        sock.emit("join-meeting", {
          meetingId,
          userId: user?._id,
          userName: user?.name || "User",
        });

     
        sock.on("ice-servers", (config) => {
          iceServers.current = config;
        });

  
        sock.on("existing-participants", (existing) => {
          // De-duplicate by socketId and exclude self defensively
          const uniq = Array.from(new Map(existing.map(p => [p.socketId, p])).values())
            .filter(p => p.socketId !== selfSocketId);
          setParticipants(uniq);

          uniq.forEach((p) => {
            createPeerConnection(p.socketId, localStream, sock, true);
          });
        });

        sock.on("user-joined", (data) => {
          if (data.socketId === selfSocketId) return;
          setParticipants((prev) => {
            const next = prev.some((p) => p.socketId === data.socketId) ? prev : [...prev, data];
            return Array.from(new Map(next.map(p => [p.socketId, p])).values());
          });

          createPeerConnection(data.socketId, localStream, sock, false);
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

        sock.on("ice-candidate", async ({ candidate, fromSocketId }) => {
          if (peerConnections.current[fromSocketId]) {
            try {
              await peerConnections.current[fromSocketId].addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (e) {}
          }
        });

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

  }, [authLoading, isAuthenticated, meetingId, navigate, user]);

  const createPeerConnection = (socketId, localStream, sock, isInitiator) => {
    if (peerConnections.current[socketId]) return;
    const rtcConfig =
      iceServers.current || { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current[socketId] = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      const inboundStream = event.streams && event.streams[0] ? event.streams[0] : null;
      if (inboundStream) {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: inboundStream }));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sock.emit("ice-candidate", {
          candidate: event.candidate,
          targetSocketId: socketId,
        });
      }
    };

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
    
        <div className="flex w-full h-[calc(100vh-96px-72px)]">
         
          <div className="flex-1 flex items-stretch justify-center bg-transparent h-full relative p-4 overflow-hidden">
        
            {(() => {
              const tiles = [];
        
              tiles.push({
                key: 'local',
                stream: mediaStream,
                label: `${user?.name || 'You'} (You)`,
                isLocal: true,
                avatarChar: user?.name?.[0] || 'U',
              });
   
              // Ensure unique participant list and exclude self defensively
              const uniqueParticipants = Array.from(
                new Map(participants.map((p) => [p.socketId, p])).values()
              ).filter((p) => p.socketId !== selfSocketId);

              uniqueParticipants.forEach((p) => {
                const s = remoteStreams[p.socketId];
                tiles.push({
                  key: p.socketId,
                  stream: s,
                  label: p.userName || 'Participant',
                  isLocal: false,
                  avatarChar: (p.userName && p.userName[0]) || 'P',
                });
              });

              const count = tiles.length;
              const getCols = (n) => {
                if (n <= 1) return 1;
                if (n <= 2) return 2;
                if (n <= 4) return 2; // 2x2 up to 4
                if (n <= 6) return 3; // 3 columns for 5-6
                if (n <= 9) return 3; // 3x3 up to 9
                if (n <= 12) return 4; // 4 columns for 10-12
                return 5; // larger rooms
              };
              const cols = getCols(count);

              // If only the local user is present, show a smaller centered preview
              if (count === 1) {
                const t = tiles[0];
                return (
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <div className="w-full max-w-[980px]" style={{ aspectRatio: '16 / 9' }}>
                      <VideoTile
                        stream={t.stream}
                        label={t.label}
                        isLocal={t.isLocal}
                        avatarChar={t.avatarChar}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div className="w-full h-full overflow-auto">
                  <div
                    className="grid gap-4 items-center content-center"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {tiles.map((t) => (
                      <div key={t.key} className="w-full" style={{ aspectRatio: '16 / 9' }}>
                        <VideoTile
                          stream={t.stream}
                          label={t.label}
                          isLocal={t.isLocal}
                          avatarChar={t.avatarChar}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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
                <Chat socket={socket} />
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
