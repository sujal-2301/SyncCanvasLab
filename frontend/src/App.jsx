import { useState, useEffect } from "react";
import io from "socket.io-client";
import SimpleCanvas from "./components/SimpleCanvas";
import RoomManager from "./components/RoomManager";
import RoomInfo from "./components/RoomInfo";
import "./App.css";

const socket = io("http://localhost:3001");

function App() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Room state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Room management functions
  const createRoom = async (roomName) => {
    try {
      const response = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Room created:", data.room);
        await joinRoom(data.room.id);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const joinRoom = async (roomCode) => {
    try {
      // Validate room first
      const validateResponse = await fetch(
        `http://localhost:3001/api/rooms/${roomCode}/validate`
      );
      const validateData = await validateResponse.json();

      if (!validateData.success) {
        throw new Error(validateData.error);
      }

      // Join the room via socket
      return new Promise((resolve, reject) => {
        socket.emit("join-room", roomCode, (response) => {
          if (response.success) {
            console.log("Successfully joined room:", roomCode);
            resolve();
          } else {
            reject(new Error(response.error));
          }
        });
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  };

  const leaveRoom = () => {
    if (currentRoom) {
      socket.emit("leave-room", currentRoom.id);
      setCurrentRoom(null);
      setUsers([]);
      setCurrentUser(null);
      console.log("Left room");
    }
  };

  // Socket event handlers
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnectionStatus("disconnected");
    });

    socket.on("room-joined", (data) => {
      console.log("Room joined:", data);
      setCurrentRoom(data.room);
      setCurrentUser(data.user);
    });

    socket.on("room-users", (roomUsers) => {
      console.log("Room users:", roomUsers);
      setUsers(roomUsers);
    });

    socket.on("user-joined", (userInfo) => {
      console.log("User joined:", userInfo);
      setUsers((prev) => [...prev, userInfo]);
    });

    socket.on("user-left", (data) => {
      console.log("User left:", data);
      setUsers((prev) => prev.filter((user) => user.id !== data.userId));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-joined");
      socket.off("room-users");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  // Format users for RoomInfo component
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    color: user.color,
    isYou: currentUser && user.id === currentUser.id,
  }));

  // Show room manager if not in a room
  if (!currentRoom) {
    return (
      <div>
        <RoomManager onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      </div>
    );
  }

  // Show the whiteboard interface when in a room
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Room Info Header */}
      <RoomInfo
        roomId={currentRoom.id}
        roomName={currentRoom.name}
        users={formattedUsers}
        onLeaveRoom={leaveRoom}
      />

      {/* Connection Status */}
      {connectionStatus !== "connected" && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          Connection: {connectionStatus}
        </div>
      )}

      {/* Main Canvas */}
      <div style={{ marginTop: "20px" }}>
        <SimpleCanvas socket={socket} roomId={currentRoom.id} />
      </div>
    </div>
  );
}

export default App;
