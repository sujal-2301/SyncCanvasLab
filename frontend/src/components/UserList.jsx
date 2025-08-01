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
    <div className="user-list">
      <h3 className="user-list-title">Online Users ({onlineUsers.length})</h3>

      <div className="users">
        {onlineUsers.map((user) => (
          <div key={user.id} className="user-item">
            <div
              className="user-avatar"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">
              {user.name} {socket.id === user.id && "(You)"}
            </span>
            <div className="user-status online"></div>
          </div>
        ))}
      </div>

      <div className="room-info">
        <h4>Room: {roomId}</h4>
        <button
          className="share-btn"
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
