import React, { useState } from "react";
import "./components.css";

const RoomInfo = ({ roomId, roomName, users, onLeaveRoom }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room code:", err);
    }
  };

  const handleShareRoom = async () => {
    const shareData = {
      title: `Join my whiteboard: ${roomName}`,
      text: `Join my collaborative whiteboard session! Room Code: ${roomId}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(
          `Join my whiteboard: ${roomName}\nRoom Code: ${roomId}\n${window.location.href}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to share room:", err);
    }
  };

  return (
    <div className="room-info">
      <div className="room-info-header">
        <div className="room-info-main">
          <h3 className="room-info-name">{roomName}</h3>
          <div className="room-info-code">
            <span className="room-code-label">Room:</span>
            <code className="room-code">{roomId}</code>
            <button
              className="room-code-copy"
              onClick={handleCopyRoomCode}
              title="Copy room code"
            >
              {copied ? "✅" : "📋"}
            </button>
          </div>
        </div>
        <div className="room-info-actions">
          <button
            className="room-info-toggle"
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? "Hide details" : "Show details"}
          >
            {showDetails ? "▼" : "▶️"}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="room-info-details">
          <div className="room-participants">
            <h4 className="room-participants-title">
              👥 Participants ({users.length})
            </h4>
            <div className="room-participants-list">
              {users.map((user) => (
                <div key={user.id} className="room-participant">
                  <div
                    className="participant-color"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="participant-name">{user.name}</span>
                  {user.isYou && <span className="participant-badge">You</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="room-actions">
            <button
              className="room-action-btn share-btn"
              onClick={handleShareRoom}
              title="Share room"
            >
              🔗 Share Room
            </button>
            <button
              className="room-action-btn leave-btn"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              🚪 Leave Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomInfo;
