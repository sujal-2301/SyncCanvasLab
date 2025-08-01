import React, { useState } from "react";
import "./components.css";

const RoomManager = ({ onJoinRoom, onCreateRoom }) => {
  const [activeTab, setActiveTab] = useState("join");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onJoinRoom(roomCode.trim().toUpperCase());
    } catch (err) {
      setError(err.message || "Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await onCreateRoom(roomName.trim() || "Untitled Room");
    } catch (err) {
      setError(err.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="room-manager">
      <div className="room-manager-container">
        <div className="room-manager-header">
                      <h1 className="room-manager-title">🎨 SyncCanvasLab</h1>
          <p className="room-manager-subtitle">
            Create or join a room to start collaborating
          </p>
        </div>

        <div className="room-tabs">
          <button
            className={`room-tab ${activeTab === "join" ? "active" : ""}`}
            onClick={() => setActiveTab("join")}
            disabled={isLoading}
          >
            🚪 Join Room
          </button>
          <button
            className={`room-tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
            disabled={isLoading}
          >
            ➕ Create Room
          </button>
        </div>

        {error && <div className="room-error">⚠️ {error}</div>}

        {activeTab === "join" && (
          <form onSubmit={handleJoinRoom} className="room-form">
            <div className="room-form-group">
              <label htmlFor="roomCode" className="room-form-label">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter 6-character room code"
                maxLength={6}
                className="room-form-input"
                disabled={isLoading}
                autoFocus
              />
              <small className="room-form-help">
                Ask the room creator for the 6-character room code
              </small>
            </div>
            <button
              type="submit"
              className="room-form-button primary"
              disabled={isLoading || !roomCode.trim()}
            >
              {isLoading ? "Joining..." : "🚪 Join Room"}
            </button>
          </form>
        )}

        {activeTab === "create" && (
          <form onSubmit={handleCreateRoom} className="room-form">
            <div className="room-form-group">
              <label htmlFor="roomName" className="room-form-label">
                Room Name (Optional)
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Awesome Canvas"
                maxLength={50}
                className="room-form-input"
                disabled={isLoading}
                autoFocus
              />
              <small className="room-form-help">
                Give your room a memorable name for easier identification
              </small>
            </div>
            <button
              type="submit"
              className="room-form-button primary"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "➕ Create Room"}
            </button>
          </form>
        )}

        <div className="room-manager-footer">
          <p className="room-manager-note">
            💡 <strong>Tip:</strong> Share your room code with others to
            collaborate in real-time!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomManager;
