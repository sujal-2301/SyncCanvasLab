import React, { useState } from "react";

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
      title: `Join my canvas: ${roomName}`,
      text: `Join my collaborative canvas session! Room Code: ${roomId}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(
          `Join my canvas: ${roomName}\nRoom Code: ${roomId}\n${window.location.href}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to share room:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
              {roomName}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Room:
              </span>
              <code className="px-2 py-1 bg-gray-100 text-gray-900 font-mono text-sm rounded border font-semibold tracking-wider">
                {roomId}
              </code>
              <button
                className={`p-1 rounded text-sm transition-colors duration-200 ${
                  copied 
                    ? 'text-success-600 hover:text-success-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={handleCopyRoomCode}
                title="Copy room code"
              >
                {copied ? "✅" : "📋"}
              </button>
            </div>
          </div>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-50"
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? "Hide details" : "Show details"}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="p-4 space-y-4 animate-slide-in bg-gray-50">
          {/* Participants */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              👥 Participants ({users.length})
            </h4>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
                    {user.name}
                  </span>
                  {user.isYou && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-primary-100 hover:border-primary-300 focus:ring-2 focus:ring-primary-200"
              onClick={handleShareRoom}
              title="Share room"
            >
              🔗 Share
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-danger-50 text-danger-600 border border-danger-200 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-danger-100 hover:border-danger-300 focus:ring-2 focus:ring-danger-200"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              🚪 Leave
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomInfo;