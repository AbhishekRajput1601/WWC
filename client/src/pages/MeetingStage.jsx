import React from "react";

const VideoTile = ({ stream, label, isLocal = false, avatarChar = "U", participantCount = 1 }) => {
  const ref = React.useRef(null);
  const [hasVideo, setHasVideo] = React.useState(false);

  React.useEffect(() => {
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
        return t.readyState === "live" && t.enabled !== false;
      }
      return t.readyState === "live" && t.muted === false;
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
      stream.addEventListener?.("addtrack", onAdd);
      stream.addEventListener?.("removetrack", onRemove);
      track?.addEventListener?.("mute", onMute);
      track?.addEventListener?.("unmute", onUnmute);
      track?.addEventListener?.("ended", onEnded);
      return () => {
        stream.removeEventListener?.("addtrack", onAdd);
        stream.removeEventListener?.("removetrack", onRemove);
        track?.removeEventListener?.("mute", onMute);
        track?.removeEventListener?.("unmute", onUnmute);
        track?.removeEventListener?.("ended", onEnded);
      };
    }
  }, [stream, isLocal]);

  const getCircleSize = () => {
    if (participantCount <= 2) return 'w-80 h-80';
    if (participantCount <= 6) return 'w-60 h-60';
    if (participantCount <= 12) return 'w-40 h-40';
    return 'w-28 h-28';
  };

  const getAvatarSize = () => {
    if (participantCount <= 2) return 'text-4xl';
    if (participantCount <= 6) return 'text-3xl';
    if (participantCount <= 12) return 'text-2xl';
    return 'text-xl';
  };

  const getLabelSize = () => {
    if (participantCount <= 4) return 'text-xs px-2 py-1';
    if (participantCount <= 9) return 'text-[10px] px-2 py-0.5';
    return 'text-[9px] px-1.5 py-0.5';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${getCircleSize()} rounded-full border-4 shadow-xl overflow-hidden flex-shrink-0`}>
        <video
          ref={ref}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-full"
          muted={isLocal}
        />
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-gradient-to-br from-wwc-600 to-wwc-700 w-full h-full rounded-full flex items-center justify-center`}>
              <span className={`text-white font-bold ${getAvatarSize()}`}>
                {avatarChar}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className={`bg-white/90 text-neutral-900 ${getLabelSize()} rounded-lg font-semibold shadow whitespace-nowrap`}>
        {label}
      </div>
    </div>
  );
};

export default function MeetingStage({
  mediaStream,
  participants,
  remoteStreams,
  selfSocketId,
  socket,
  isScreenSharing,
  remoteScreenSharerId,
  screenStreamRef,
  localVideoRef,
  showCaptions,
  currentCaption,
  user
}) {
  return (
    <div className="flex-1 flex items-stretch justify-center bg-transparent h-full relative p-4 overflow-hidden">
      {(() => {
        const tiles = [];

        tiles.push({
          key: "local",
          stream: mediaStream,
          label: `${user?.name || "You"} (You)`,
          isLocal: true,
          avatarChar: user?.name?.[0] || "U",
        });

        const uniqueParticipants = Array.from(
          new Map(participants.map((p) => [p.socketId, p])).values()
        ).filter((p) => p.socketId !== selfSocketId && p.socketId !== socket?.id);
        uniqueParticipants.forEach((p) => {
          const s = remoteStreams[p.socketId];
          if (s) {
            tiles.push({
              key: p.socketId,
              stream: s,
              label: p.userName || "Participant",
              isLocal: false,
              avatarChar: (p.userName && p.userName[0]) || "P",
            });
          }
        });
        const activeShareId = isScreenSharing
          ? "local"
          : remoteScreenSharerId;
        if (activeShareId) {
          const shareStream = isScreenSharing
            ? screenStreamRef.current || mediaStream
            : remoteStreams[remoteScreenSharerId];
          return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <div
                className="w-full max-w-[980px]"
                style={{ aspectRatio: "16 / 9" }}
              >
                <div className="relative bg-black rounded-2xl border-4 border-white shadow-xl overflow-hidden w-full h-full">
                  <video
                    autoPlay
                    playsInline
                    muted={isScreenSharing}
                    className="w-full h-full object-contain bg-black"
                    ref={(el) => {
                      if (!el) return;
                      el.srcObject = shareStream || null;
                    }}
                  />

                  <div className="absolute bottom-6 right-6 flex items-center space-x-3">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-hard overflow-hidden bg-neutral-800 hidden sm:block">
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        ref={(el) => {
                          if (!el) return;
                          const pipStream = isScreenSharing
                            ? mediaStream
                            : remoteStreams[selfSocketId];
                          el.srcObject = pipStream || null;
                        }}
                      />
                    </div>
                    <div className="bg-white/90 px-3 py-1.5 rounded-xl text-sm font-semibold text-neutral-900 shadow">
                      {isScreenSharing
                        ? user?.name || "You"
                        : participants.find(
                            (p) => p.socketId === remoteScreenSharerId
                          )?.userName || "Presenter"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const count = tiles.length;
        return (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <div className="flex items-center justify-center gap-0">
              {tiles.map((t, index) => (
                <React.Fragment key={t.key}>
                  <VideoTile
                    stream={t.stream}
                    label={t.label}
                    isLocal={t.isLocal}
                    avatarChar={t.avatarChar}
                    participantCount={count}
                  />
                  {index < tiles.length - 1 && (
                    <div className="flex items-center px-6">
                      <div className="w-16 h-1 bg-black"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })()}

      {showCaptions && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 max-w-2xl z-50">
          <div className="bg-white/95 backdrop-blur-md text-neutral-900 px-6 py-3 rounded-2xl border border-neutral-200 shadow-medium min-h-[48px] flex items-center justify-center">
            <p className="text-center font-medium">
              {currentCaption ? (
                currentCaption
              ) : (
                <span className="text-neutral-400 italic">Listening...</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
