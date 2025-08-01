import React, { useState } from "react";

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
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            🎨
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SyncCanvasLab</h1>
          <p className="text-gray-600 text-sm">
            Create or join a room to start collaborating
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "join"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("join")}
              disabled={isLoading}
            >
              🚪 Join Room
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "create"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("create")}
              disabled={isLoading}
            >
              ➕ Create Room
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm flex items-center gap-2 animate-slide-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Join Room Form */}
          {activeTab === "join" && (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-lg uppercase tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Ask the room creator for the 6-character room code
                </p>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !roomCode.trim()}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>🚪 Join Room</>
                )}
              </button>
            </form>
          )}

          {/* Create Room Form */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="My Awesome Canvas"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Give your room a memorable name for easier identification
                </p>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>➕ Create Room</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-lg">💡</span>
            <p>
              <strong className="text-gray-900">Tip:</strong> Share your room code with others to collaborate in real-time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManager;