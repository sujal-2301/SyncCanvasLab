import React, { useState } from "react";

const RoomManager = ({ onJoinRoom, onCreateRoom }) => {
  const [activeTab, setActiveTab] = useState("join");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onJoinRoom(roomCode.trim().toUpperCase(), username.trim());
    } catch (err) {
      // Provide more specific feedback for common errors
      if (err.message.includes("Room not found")) {
        setError("Room not found. Please check the code and try again.");
      } else {
        setError(err.message || "Failed to join the room.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      await onCreateRoom(roomName.trim() || "Untitled Room", username.trim());
    } catch (err) {
      setError(err.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-1 sm:p-2">
      <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 text-center bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold mx-auto mb-2 sm:mb-3">
            🎨
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
            SyncCanvasLab
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Create or join a room to start collaborating
          </p>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4">
          {/* Username Input */}
          <div className="mb-4 sm:mb-6">
            <label
              htmlFor="username"
              className="block text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3"
            >
              👤 Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              maxLength={25}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4 sm:mb-6">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
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
            <form onSubmit={handleJoinRoom} className="space-y-6">
              {/* Room Code Section */}
              <div className="text-center">
                <div className="mb-4">
                  <label
                    htmlFor="roomCode"
                    className="block text-lg font-semibold text-gray-900 mb-3"
                  >
                    📱 Enter Room Code
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Ask the room creator to share their 6-character room code
                  </p>
                </div>

                {/* Large, prominent room code input */}
                <div className="relative">
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-center font-mono text-2xl sm:text-3xl uppercase tracking-[0.3em] font-bold focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 bg-white shadow-sm"
                    disabled={isLoading}
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-gray-400 text-lg">🔑</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-gray-400 text-sm font-mono">
                      {roomCode.length}/6
                    </span>
                  </div>
                </div>

                {/* Visual indicator for room code format */}
                <div className="mt-3 flex justify-center">
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                          i < roomCode.length ? "bg-primary-500" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Help text */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center justify-center gap-2">
                    <span>💡</span>
                    <span>Room codes are 6 characters long (e.g., ABC123)</span>
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                disabled={isLoading || !roomCode.trim() || !username.trim()}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
            <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-6">
              <div>
                <label
                  htmlFor="roomName"
                  className="block text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3"
                >
                  🏠 Room Name (Optional)
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="My Awesome Canvas"
                  maxLength={50}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm sm:text-base"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                  Give your room a memorable name for easier identification
                </p>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={isLoading || !username.trim()}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
            <span className="text-base sm:text-lg flex-shrink-0">💡</span>
            <p className="leading-relaxed">
              <strong className="text-gray-900">Tip:</strong> Share your room
              code with others to collaborate in real-time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManager;
