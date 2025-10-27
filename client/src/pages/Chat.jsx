import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Chat = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

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
  }, [authLoading, isAuthenticated, meetingId, navigate]);

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

  const goBackToMeeting = () => {
    navigate(`/meeting/${meetingId}`);
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
            Loading Chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-4 flex items-center justify-center min-h-[calc(100vh-96px)]">
      <div className="h-full bg-white border-2 border-black rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-neutral-500 text-lg font-semibold">No messages yet</p>
              <p className="text-neutral-400 text-sm mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="flex space-x-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base">
                    {message.sender?.[0] || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-base font-semibold text-neutral-900">
                      {message.sender}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {message.timestamp}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl px-5 py-4 border border-neutral-200">
                    <p className="text-neutral-700 leading-relaxed text-base">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Chat Input */}
        <div className="p-6 border-t-2 border-black bg-white">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border-2 border-black rounded-xl text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-neutral-50 shadow-sm text-base"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-black ${
                newMessage.trim()
                  ? "bg-black text-white hover:bg-neutral-800"
                  : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
              }`}
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="ml-2">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;