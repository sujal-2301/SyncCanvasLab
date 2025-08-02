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
    <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 text-center bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold mx-auto mb-1 sm:mb-2">
            🎨
          </div>
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1">
            SyncCanvasLab
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Create or join a room to start collaborating
          </p>
        </div>

        <div className="px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col">
          {/* Username Input */}
          <div className="mb-2 sm:mb-3">
            <label
              htmlFor="username"
              className="block text-sm sm:text-base font-semibold text-gray-900 mb-1"
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
              className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-2 sm:mb-3">
            <button
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === "join"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("join")}
              disabled={isLoading}
            >
              🚪 Join
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === "create"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("create")}
              disabled={isLoading}
            >
              ➕ Create
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-2 p-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md text-xs sm:text-sm flex items-center gap-2 animate-slide-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Join Room Form */}
          {activeTab === "join" && (
            <form
              onSubmit={handleJoinRoom}
              className="space-y-2 flex-1 flex flex-col"
            >
              {/* Room Code Section */}
              <div className="text-center">
                <div className="mb-1 sm:mb-2">
                  <label
                    htmlFor="roomCode"
                    className="block text-sm sm:text-base font-semibold text-gray-900 mb-1"
                  >
                    📱 Enter Room Code
                  </label>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
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
                    className="w-full px-4 sm:px-6 py-3 border-2 border-gray-300 rounded-xl text-center font-mono text-lg sm:text-xl uppercase tracking-wider font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 bg-white shadow-sm"
                    disabled={isLoading}
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                    <span className="text-gray-400 text-sm sm:text-base">
                      🔑
                    </span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                    <span className="text-gray-400 text-xs sm:text-sm font-mono">
                      {roomCode.length}/6
                    </span>
                  </div>
                </div>

                {/* Visual indicator for room code format */}
                <div className="mt-1 flex justify-center">
                  <div className="flex gap-1 sm:gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200 ${
                          i < roomCode.length ? "bg-primary-500" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Help text */}
                <div className="mt-1 p-1 sm:p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 flex items-center justify-center gap-1">
                    <span>💡</span>
                    <span>Room codes are 6 characters long (e.g., ABC123)</span>
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 sm:px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
            <form
              onSubmit={handleCreateRoom}
              className="space-y-2 flex-1 flex flex-col"
            >
              <div>
                <label
                  htmlFor="roomName"
                  className="block text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2"
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm sm:text-base"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-600">
                  Give your room a memorable name for easier identification
                </p>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 sm:px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
        <div className="px-4 sm:px-6 pb-2 pt-1 border-t border-gray-100 bg-gray-50">
          <div className="flex items-start gap-1 text-xs text-gray-600">
            <span className="text-xs flex-shrink-0">💡</span>
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
