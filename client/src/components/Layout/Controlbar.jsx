import React from "react";

const Controlbar = ({
  isMuted,
  isVideoOn,
  showCaptions,
  selectedLanguage,
  isScreenSharing,
  endingMeeting,
  endMeetingError,
  toggleMute,
  toggleVideo,
  toggleCaptions,
  setSelectedLanguage,
  toggleScreenShare,
  handleEndMeeting,
  isCreator,
  isRecording,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-6 py-4 shadow-hard">
      <div className="flex items-center justify-center space-x-4">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMute();
          }}
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.636 5.636l12.728 12.728M5.636 18.364L18.364 5.636"
              />
            )}
          </svg>
        </button>

        {/* Video Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleVideo();
          }}
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
                d="M5.636 5.636l12.728 12.728M5.636 18.364L18.364 5.636"
              />
            )}
          </svg>
        </button>

        {/* Captions Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCaptions();
          }}
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
            onChange={(e) => {
              e.stopPropagation();
              setSelectedLanguage(e.target.value);
            }}
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
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleScreenShare();
          }}
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
        {/* Record Meeting - visible to everyone */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isRecording) onStopRecording(); else onStartRecording();
          }}
          className={`px-2 py-2 rounded-lg font-semibold transition-all duration-150 shadow-soft hover:shadow-medium border-2 border-black ${isRecording ? 'bg-red-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
          title={isRecording ? 'Stop recording' : 'Record meeting'}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6" />
            </svg>
            <span className="text-xs">{isRecording ? 'Stop' : 'Record'}</span>
          </div>
        </button>
        {/* End Meeting Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEndMeeting();
          }}
          disabled={endingMeeting}
          className="px-5 py-2 rounded-xl font-bold bg-error-600 text-white shadow-soft border-2 border-error-700 hover:bg-error-700 transition-all duration-200"
          title="End Meeting"
        >
          {endingMeeting ? "Ending..." : "End Meeting"}
        </button>
        {endMeetingError && (
          <span className="text-error-600 ml-4 font-semibold">
            {endMeetingError}
          </span>
        )}
      </div>
    </div>
  );
};

export default Controlbar;
