import { useState, useEffect, useMemo } from "react";
import io from "socket.io-client";
import SimpleCanvas from "./components/SimpleCanvas";
import RoomManager from "./components/RoomManager";
import DrawingToolbar from "./components/DrawingToolbar";
import InfoModal from "./components/InfoModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : `http://${window.location.hostname}:3001`);

// Ensure BACKEND_URL has proper protocol and no trailing slashes
const getBackendUrl = (url) => {
  if (!url) return url;
  
  // Remove any trailing slashes
  let cleanUrl = url.replace(/\/+$/, '');
  
  // Add protocol if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  return cleanUrl;
};

const BACKEND_URL_FINAL = getBackendUrl(BACKEND_URL);

// Debug: Log the backend URL being used
console.log('Backend URL:', BACKEND_URL_FINAL);

const socket = io(BACKEND_URL_FINAL);

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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Room management functions
  const createRoom = async (roomName, username) => {
    try {
      const response = await fetch(`${BACKEND_URL_FINAL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Room created:", data.room);
        // Manually set the room to trigger UI transition immediately
        setCurrentRoom(data.room);
        await joinRoom(data.room.id, username);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const joinRoom = async (roomCode, username) => {
    try {
      // Validate room first
      const validateResponse = await fetch(
        `${BACKEND_URL_FINAL}/api/rooms/${roomCode}/validate`
      );
      const validateData = await validateResponse.json();

      if (!validateData.success) {
        throw new Error(validateData.error);
      }

      // Join the room via socket
      return new Promise((resolve, reject) => {
        socket.emit("join-room", { roomCode, username }, (response) => {
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
      console.log(`Leaving room: ${currentRoom.id}`);
      socket.emit("leave-room", currentRoom.id);
      setCurrentRoom(null);
      setUsers([]);
      setCurrentUser(null);
      console.log("Left room and cleared state");
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
      setUsers((prev) => {
        const filtered = prev.filter((user) => user.id !== data.userId);
        console.log(`Updated users list: ${filtered.length} users remaining`);
        return filtered;
      });
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

  // Handle page unload/visibility change for mobile compatibility
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentRoom) {
        console.log(`Page unloading - leaving room: ${currentRoom.id}`);
        socket.emit("leave-room", currentRoom.id);
        // Also emit force-leave as backup
        socket.emit("force-leave-room", currentRoom.id);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentRoom) {
        console.log(`Page hidden - leaving room: ${currentRoom.id}`);
        socket.emit("leave-room", currentRoom.id);
        // Also emit force-leave as backup
        socket.emit("force-leave-room", currentRoom.id);
      }
    };

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentRoom]);

  // Heartbeat mechanism to detect connection issues
  useEffect(() => {
    if (!currentRoom) return;

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 30000); // Send heartbeat every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [currentRoom]);

  // Force leave room when component unmounts
  useEffect(() => {
    return () => {
      if (currentRoom) {
        console.log(`Component unmounting - forcing leave room: ${currentRoom.id}`);
        // Try normal leave first, then force leave as backup
        socket.emit("leave-room", currentRoom.id);
        // Also emit force-leave as a backup mechanism
        setTimeout(() => {
          socket.emit("force-leave-room", currentRoom.id);
        }, 1000);
      }
    };
  }, [currentRoom]);

  // Format users for RoomInfo component
  const formattedUsers = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        name: user.name,
        color: user.color,
        isYou: currentUser && user.id === currentUser.id,
      })),
    [users, currentUser]
  );

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
    <div
      className="h-[100svh] bg-gray-50 flex flex-col animate-fade-in overflow-hidden"
      style={{ height: "100svh" }}
    >
      {/* Compact Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-12 sm:h-14">
            {/* Logo and Brand */}
            <div className="flex items-center min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">
                  S
                </span>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
                SyncCanvas<span className="text-primary-500">Lab</span>
              </span>
            </div>

            {/* Room Info and Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              {/* Info Button - Mobile Only */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Room Information"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Room Code - Hidden on mobile */}
              <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                <span className="font-mono font-medium text-gray-900">
                  {currentRoom.id}
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-success-500 animate-pulse-soft"
                      : connectionStatus === "connecting"
                      ? "bg-warning-500 animate-pulse"
                      : "bg-danger-500"
                  }`}
                ></div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    connectionStatus === "connected"
                      ? "text-success-600"
                      : connectionStatus === "connecting"
                      ? "text-warning-600"
                      : "text-danger-600"
                  }`}
                >
                  {connectionStatus === "connected"
                    ? "Online"
                    : connectionStatus === "connecting"
                    ? "Connecting"
                    : "Offline"}
                </span>
              </div>

              {/* Leave Room Button */}
              <button
                onClick={leaveRoom}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Leave</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Connection Status Alert */}
      {connectionStatus !== "connected" && (
        <div className="bg-warning-50 border-l-4 border-warning-500 p-2 sm:p-4 animate-slide-in flex-shrink-0">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-2 text-xs sm:text-sm text-warning-700">
              {connectionStatus === "connecting"
                ? "Connecting..."
                : "Connection lost - Reconnecting..."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area - Full Height */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Users Overlay */}
        <div className="lg:hidden absolute top-2 left-2 z-50">
          <div className="bg-white rounded-full shadow-lg p-1.5 border border-gray-200 flex items-center">
            <div className="flex -space-x-2">
              {formattedUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-200"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                />
              ))}
            </div>
            {users.length > 4 && (
              <div className="ml-2 text-xs font-medium text-gray-500">
                +{users.length - 4} more
              </div>
            )}
            <div className="ml-3 pl-2 border-l border-gray-200 text-sm font-semibold text-gray-800">
              {users.length} <span className="font-normal">Online</span>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 shadow-sm flex-col">
          {/* Always Visible User List */}
          <div className="p-4 border-b border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentRoom.name || "Canvas Room"}
              </h3>
              <div className="text-sm text-gray-500 font-mono">
                Room ID: {currentRoom.id}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                👥 Online Users ({users.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formattedUsers.map((user) => (
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

          {/* Drawing Tools */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Drawing Tools
            </h3>
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

        {/* Full Canvas Area */}
        <div className="flex-1 relative bg-white overflow-hidden">
          <SimpleCanvas
            socket={socket}
            roomId={currentRoom.id}
            activeTool={activeTool}
            brushSize={brushSize}
            brushColor={brushColor}
            onCanvasFunctionsReady={setCanvasFunctions}
          />

          {/* Mobile Floating Controls */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
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
                isMobile={true}
              />
            </div>
          </div>
        </div>
      </div>

      {isInfoModalOpen && (
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          roomId={currentRoom.id}
          roomName={currentRoom.name}
          users={formattedUsers}
        />
      )}
    </div>
  );
}

export default App;
