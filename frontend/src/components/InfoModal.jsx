import React from "react";

const InfoModal = ({ isOpen, onClose, roomId, roomName, users }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm m-4 p-6 animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Room Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Room Name</h3>
            <p className="text-lg font-semibold text-gray-800">
              {roomName || "Canvas Room"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Room ID</h3>
            <p className="text-lg font-mono text-primary-600 bg-primary-50 p-2 rounded-md">
              {roomId}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Online Users ({users.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
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
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
