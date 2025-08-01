import { useState, useEffect } from "react";

const UserList = ({ socket, roomId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Listen for room users data
    socket.on("room-users", (users) => {
      setOnlineUsers(users);
    });

    // Listen for new users joining
    socket.on("user-joined", (userInfo) => {
      setOnlineUsers((prev) => {
        const existing = prev.find((u) => u.id === userInfo.id);
        if (existing) return prev;
        return [...prev, userInfo];
      });
    });

    // Listen for users leaving
    socket.on("user-left", (data) => {
      setOnlineUsers((prev) => prev.filter((user) => user.id !== data.userId));
    });

    // Set current user when socket connects
    if (socket.id) {
      const currentUserInfo = onlineUsers.find((u) => u.id === socket.id);
      setCurrentUser(currentUserInfo);
    }

    return () => {
      socket.off("room-users");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [socket, onlineUsers]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Online Users ({onlineUsers.length})
      </h3>

      <div className="space-y-3">
        {onlineUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-medium text-gray-900">
              {user.name} {socket.id === user.id && (
                <span className="text-primary-600 font-semibold">(You)</span>
              )}
            </span>
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Room: {roomId}</h4>
        <button
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-primary-100 hover:border-primary-300"
          onClick={() => {
            const roomUrl = `${window.location.origin}?room=${roomId}`;
            navigator.clipboard.writeText(roomUrl);
            // You could add a toast notification here
          }}
        >
          📋 Copy Room Link
        </button>
      </div>
    </div>
  );
};

export default UserList;