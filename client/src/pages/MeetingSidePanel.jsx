import React, { Suspense } from "react";
const Chat = React.lazy(() => import("./Chat.jsx"));
const AllUsers = React.lazy(() => import("./Participants.jsx"));

export default function MeetingSidePanel({ activePanel, socket, user, isMuted, participants }) {
  return (
    <>
      {activePanel === "chat" && (
        <Suspense fallback={<div>Loading Chat...</div>}>
          <Chat socket={socket} />
        </Suspense>
      )}
      {activePanel === "users" && (
        <Suspense fallback={<div>Loading Users...</div>}>
          <AllUsers user={user} isMuted={isMuted} participants={participants} />
        </Suspense>
      )}
    </>
  );
}
