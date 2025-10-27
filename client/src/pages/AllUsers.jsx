import React from "react";

const AllUsers = ({ user, isMuted, participants }) => (
  <div className="w-64 bg-white border-l border-neutral-200 flex flex-col shadow-medium">
    <div className="p-2 border-b border-neutral-200">
      <h3 className="font-bold text-neutral-900 font-display text-base">Participants (1)</h3>
    </div>
    <div className="flex flex-col items-center justify-center p-2">
      {/* Host (You) */}
      <div className="flex items-center justify-between p-2 bg-wwc-50 rounded-xl border border-wwc-200 w-full max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">{user?.name?.[0] || "U"}</span>
          </div>
          <div>
            <p className="font-medium text-neutral-900 text-sm">{user?.name || "You"}</p>
            <p className="text-xs text-wwc-600 font-medium">Host</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {!isMuted ? (
            <div className="w-5 h-5 bg-success-600 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 bg-error-600 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AllUsers;
