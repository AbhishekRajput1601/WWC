import React from "react";

const AllUsers = ({ user, isMuted, participants }) => (
  <div className="w-[400px] h-[565px] max-h-[calc(100vh-120px)] bg-white border-2 border-black rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-20 mr-5 mt-1">
    <div className="p-4 border-b-2 border-black bg-neutral-50">
      <h3 className="font-bold text-neutral-900 font-display text-lg">
        Participants ({1 + (participants?.length || 0)})
      </h3>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Host (You) */}
      <div className="flex items-center justify-between p-3 bg-wwc-50 rounded-xl border border-wwc-200 w-full relative">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-base">
              {user?.name?.[0] || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-neutral-900 text-base">
              {user?.name || "You"}
            </p>
            <p className="text-xs text-wwc-600 font-medium">Host</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* LIVE indicator */}
          <div className="bg-error-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
            <div className="w-2 h-2 rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
          {/* Mic status */}
          {!isMuted ? (
            <div className="w-6 h-6 bg-success-600 rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 bg-error-600 rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
      {/* Other participants */}
      {participants &&
        participants.map((p) => (
          <div
            key={p.socketId}
            className="flex items-center justify-between p-3 bg-neutral-100 rounded-xl border border-neutral-200 w-full relative"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-wwc-400 to-wwc-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-base">
                  {p.userName?.[0] || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-neutral-900 text-base">
                  {p.userName}
                </p>
                <p className="text-xs text-neutral-500 font-medium">Guest</p>
              </div>
            </div>
    
            <div className="flex items-center space-x-2">
              <div className="bg-error-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
                <div className="w-2 h-2 rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
        
              <div className="w-6 h-6 bg-success-600 rounded-md flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
);

export default AllUsers;
