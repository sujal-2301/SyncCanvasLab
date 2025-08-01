import { useState, useEffect } from "react";
import io from "socket.io-client";
import SimpleCanvas from "./components/SimpleCanvas";
import RoomManager from "./components/RoomManager";
import RoomInfo from "./components/RoomInfo";
import DrawingToolbar from "./components/DrawingToolbar";

const socket = io("http://localhost:3001");

function App() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Room state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Drawing tool states (moved to App level for global access)
  const [activeTool, setActiveTool] = useState("pen");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");

  // Canvas functions ref (to be set by SimpleCanvas)
  const [canvasFunctions, setCanvasFunctions] = useState({
    clearCanvas: () => {},
    saveAsPNG: () => {},
    saveAsJPG: () => {},
  });

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md animate-fade-in">
        <RoomManager onCreateRoom={createRoom} onJoinRoom={joinRoom} />
        </div>
      </div>
    );
  }

  // Show the canvas interface when in a room
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-fade-in">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">
                  SyncCanvas<span className="text-primary-500">Lab</span>
                </span>
              </div>
            </div>

            {/* Room Info Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Room: <span className="font-mono font-medium text-gray-900">{currentRoom.id}</span>
              </div>
              <div className="text-sm text-gray-500">
                {users.length} {users.length === 1 ? 'user' : 'users'} online
              </div>
            </div>

            {/* Connection Status and Leave Button */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-success-500 animate-pulse-soft' 
                    : connectionStatus === 'connecting' 
                    ? 'bg-warning-500 animate-pulse' 
                    : 'bg-danger-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  connectionStatus === 'connected' 
                    ? 'text-success-600' 
                    : connectionStatus === 'connecting'
                    ? 'text-warning-600'
                    : 'text-danger-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>

              {/* Leave Room Button */}
              <button
                onClick={leaveRoom}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Connection Status Alert */}
      {connectionStatus !== "connected" && (
        <div className="bg-warning-50 border-l-4 border-warning-500 p-4 animate-slide-in">
          <div className="flex items-center">
            <div className="flex">
              <svg className="w-5 h-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-700">
                Connection status: <span className="font-medium">{connectionStatus}</span>
                {connectionStatus === "connecting" && " - Please wait while we establish connection..."}
                {connectionStatus === "disconnected" && " - Attempting to reconnect..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Room Info Header */}
          <div className="p-6 border-b border-gray-200">
      <RoomInfo
        roomId={currentRoom.id}
        roomName={currentRoom.name}
        users={formattedUsers}
        onLeaveRoom={leaveRoom}
      />
          </div>

          {/* Drawing Tools */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawing Tools</h3>
            <DrawingToolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              onClearCanvas={canvasFunctions.clearCanvas}
              onSaveAsPNG={canvasFunctions.saveAsPNG}
              onSaveAsJPG={canvasFunctions.saveAsJPG}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-100">
          <SimpleCanvas 
            socket={socket} 
            roomId={currentRoom.id}
            activeTool={activeTool}
            brushSize={brushSize}
            brushColor={brushColor}
            onCanvasFunctionsReady={setCanvasFunctions}
          />
          
          {/* Floating Status Bar */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs font-medium">
            <div className="flex items-center space-x-3">
              <span>Room: {currentRoom.name || currentRoom.id}</span>
              <span>•</span>
              <span>{users.length} online</span>
              <span>•</span>
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  connectionStatus === 'connected' ? 'bg-success-400' : 'bg-danger-400'
                }`}></div>
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;