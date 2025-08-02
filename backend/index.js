const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.onrender\.com$/,
    ],
    methods: ["GET", "POST"],
  },
});

// In-memory storage for MVP (replace with database later)
const rooms = new Map();
const users = new Map();

// User colors for cursor tracking
const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FECA57",
  "#FF9FF3",
  "#54A0FF",
  "#5F27CD",
  "#00D2D3",
  "#FF9F43",
  "#10AC84",
  "#EE5A24",
  "#0C2461",
  "#1DD1A1",
  "#FD79A8",
];

// Generate a random user color
const getUserColor = () => {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
};

// Generate a unique room code
const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure the room code is unique
  if (rooms.has(result)) {
    return generateRoomCode(); // Recursively generate until unique
  }
  return result;
};

// Create a new room
const createRoom = (roomName, creatorSocketId = null) => {
  const roomCode = generateRoomCode();
  const room = {
    id: roomCode,
    name: roomName || "Untitled Room",
    createdAt: new Date(),
    creatorSocketId,
    users: new Map(),
    canvasData: [], // Store drawing events
    viewportTransform: [1, 0, 0, 1, 0, 0], // Default viewport
  };
  rooms.set(roomCode, room);
  console.log(`Room created: ${roomCode} - "${roomName}"`);
  return room;
};

// Validate if a room exists and is accessible
const validateRoom = (roomCode) => {
  if (!roomCode || typeof roomCode !== "string") {
    return { valid: false, error: "Invalid room code format" };
  }

  const normalizedCode = roomCode.toUpperCase().trim();
  if (normalizedCode.length !== 6) {
    return { valid: false, error: "Room code must be 6 characters" };
  }

  const room = rooms.get(normalizedCode);
  if (!room) {
    return { valid: false, error: "Room not found" };
  }

  return { valid: true, room };
};

// Generate a random username
const generateUsername = () => {
  const adjectives = [
    "Cool",
    "Smart",
    "Creative",
    "Awesome",
    "Brilliant",
    "Amazing",
    "Fantastic",
    "Super",
    "Quick",
    "Clever",
  ];
  const nouns = [
    "Designer",
    "Artist",
    "Creator",
    "Maker",
    "Builder",
    "Thinker",
    "Innovator",
    "Explorer",
    "Dreamer",
    "Visionary",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
};

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Create a new room
app.post("/api/rooms", (req, res) => {
  try {
    const { roomName } = req.body;
    console.log(`Creating room with name: ${roomName}`);

    const room = createRoom(roomName);
    console.log(`Room created successfully: ${room.id}`);
    console.log(`Total rooms now:`, Array.from(rooms.keys()));

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create room",
    });
  }
});

// Validate room access
app.get("/api/rooms/:roomCode/validate", (req, res) => {
  try {
    const { roomCode } = req.params;
    console.log(`Validating room: ${roomCode}`);
    console.log(`Available rooms:`, Array.from(rooms.keys()));

    const validation = validateRoom(roomCode);
    console.log(`Validation result:`, validation);

    if (!validation.valid) {
      console.log(`Room validation failed: ${validation.error}`);
      return res.status(404).json({
        success: false,
        error: validation.error,
      });
    }

    console.log(`Room validation successful for: ${roomCode}`);
    res.json({
      success: true,
      room: {
        id: validation.room.id,
        name: validation.room.name,
        participantCount: validation.room.users.size,
      },
    });
  } catch (error) {
    console.error("Error validating room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate room",
    });
  }
});

// Get room info
app.get("/api/rooms/:roomCode", (req, res) => {
  try {
    const { roomCode } = req.params;
    const validation = validateRoom(roomCode);

    if (!validation.valid) {
      return res.status(404).json({
        success: false,
        error: validation.error,
      });
    }

    const room = validation.room;
    const participants = Array.from(room.users.values()).map((user) => ({
      id: user.id,
      name: user.name,
      color: user.color,
    }));

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        createdAt: room.createdAt,
        participantCount: room.users.size,
        participants,
      },
    });
  } catch (error) {
    console.error("Error getting room info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get room info",
    });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room with validation
  socket.on("join-room", ({ roomCode, username }, callback) => {
    try {
      const roomId = roomCode.toUpperCase();

      // Check if room exists
      if (!rooms.has(roomId)) {
        console.log(`Room ${roomId} not found for user ${socket.id}`);
        return callback({
          success: false,
          error: "Room not found. Please check the room code.",
        });
      }

      const room = rooms.get(roomId);
      socket.join(roomId);

      // Create user info with cursor data
      const userInfo = {
        id: socket.id,
        name: username || generateUsername(), // Use provided username or generate one
        color: getUserColor(),
        cursor: { x: 0, y: 0, visible: false },
        joinedAt: new Date(),
      };

      room.users.set(socket.id, userInfo);
      users.set(socket.id, { ...userInfo, roomId });

      // Send existing canvas data and viewport to the new user
      socket.emit("canvas-state", {
        drawingData: room.canvasData,
        viewport: room.viewportTransform,
      });

      // Send all current users to the new user
      const allUsers = Array.from(room.users.values());
      socket.emit("room-users", allUsers);

      // Send room info to the new user
      socket.emit("room-joined", {
        room: {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt,
        },
        user: {
          id: userInfo.id,
          name: userInfo.name,
          color: userInfo.color,
        },
      });

      // Notify others about new user
      socket.to(roomId).emit("user-joined", userInfo);

      console.log(
        `User ${userInfo.name} (${socket.id}) joined room ${roomId}. Total users: ${room.users.size}`
      );

      if (callback) callback({ success: true });
    } catch (error) {
      console.error("Error joining room:", error);
      if (callback) callback({ success: false, error: "Failed to join room" });
    }
  });

  // Handle viewport updates
  socket.on("viewport:update", ({ roomId, viewport }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.viewportTransform = viewport;
      socket.to(roomId).emit("viewport:updated", viewport);
    }
  });

  // Handle drawing events
  socket.on("drawing", (data) => {
    const { roomId } = data;
    console.log("Received drawing data for room:", roomId);

    // Store the drawing data in room
    if (rooms.has(roomId)) {
      rooms.get(roomId).canvasData.push(data);
      console.log(
        "Stored drawing data. Total items:",
        rooms.get(roomId).canvasData.length
      );
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit("drawing", data);
    console.log("Broadcasted drawing data to room:", roomId);
  });

  // Handle cursor movement
  socket.on("cursor-move", (data) => {
    const userInfo = users.get(socket.id);
    if (!userInfo) return;

    console.log(`Cursor move from ${userInfo.name}: x=${data.x}, y=${data.y}`);
    const { roomId } = userInfo;
    const room = rooms.get(roomId);
    if (!room) return;

    // Update cursor position for this user
    const user = room.users.get(socket.id);
    if (user) {
      user.cursor = {
        x: data.x,
        y: data.y,
        visible: true,
      };

      // Broadcast cursor position to other users in the room
      socket.to(roomId).emit("cursor-update", {
        userId: socket.id,
        name: user.name,
        color: user.color,
        x: user.cursor.x,
        y: user.cursor.y,
        visible: user.cursor.visible,
      });
    }
  });

  // Handle cursor leave (when user stops moving mouse)
  socket.on("cursor-leave", () => {
    const userInfo = users.get(socket.id);
    if (!userInfo) return;

    const { roomId } = userInfo;
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.cursor.visible = false;

      // Broadcast cursor hide to other users
      socket.to(roomId).emit("cursor-update", {
        userId: socket.id,
        name: user.name,
        color: user.color,
        x: user.cursor.x,
        y: user.cursor.y,
        visible: user.cursor.visible,
      });
    }
  });

  // Handle explicit room leave
  socket.on("leave-room", (roomId) => {
    const userInfo = users.get(socket.id);
    if (!userInfo) {
      console.log(`Leave-room called for unknown user: ${socket.id}`);
      return;
    }

    const room = rooms.get(roomId);
    if (room && room.users.has(socket.id)) {
      const user = room.users.get(socket.id);

      // Remove user from room first
      room.users.delete(socket.id);
      socket.leave(roomId);

      // Notify others in the room BEFORE cleaning up user data
      socket.to(roomId).emit("user-left", {
        userId: socket.id,
        name: user.name,
      });

      console.log(
        `User ${user.name} (${socket.id}) left room ${roomId}. Remaining users: ${room.users.size}`
      );

      // Clean up empty rooms
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted - no users remaining`);
      }
    } else {
      console.log(
        `User ${socket.id} not found in room ${roomId} for leave-room`
      );
    }

    // Clean up user data last
    users.delete(socket.id);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userInfo = users.get(socket.id);
    const userName = userInfo ? userInfo.name : socket.id;
    console.log("User disconnected:", userName);

    // Remove user from all rooms first
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);

        // Notify others in the room
        socket.to(roomId).emit("user-left", {
          userId: socket.id,
          name: user.name,
        });

        console.log(
          `User ${user.name} (${socket.id}) disconnected from room ${roomId}. Remaining users: ${room.users.size}`
        );

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(
            `Room ${roomId} deleted - no users remaining after disconnect`
          );
        }
      }
    }

    // Remove user from global users map last
    users.delete(socket.id);
  });

  // Handle heartbeat to detect stale connections
  socket.on("heartbeat", () => {
    socket.emit("heartbeat-ack");
  });

  // Force leave room (for cleanup purposes)
  socket.on("force-leave-room", (roomId) => {
    const userInfo = users.get(socket.id);
    if (!userInfo) return;

    const room = rooms.get(roomId);
    if (room && room.users.has(socket.id)) {
      const user = room.users.get(socket.id);

      // Remove user from room
      room.users.delete(socket.id);
      socket.leave(roomId);

      // Notify others in the room
      socket.to(roomId).emit("user-left", {
        userId: socket.id,
        name: user.name,
      });

      console.log(
        `User ${user.name} (${socket.id}) force-left room ${roomId}. Remaining users: ${room.users.size}`
      );

      // Clean up empty rooms
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(
          `Room ${roomId} deleted - no users remaining after force leave`
        );
      }
    }

    // Clean up user data
    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
