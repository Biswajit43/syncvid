const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");



const app = express();
const httpServer = createServer(app);
 
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all, change to frontend domain for production
    methods: ["GET", "POST"],
  },
});

// Store rooms: { roomCode: { hostId, videoId, participants: [] } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ New user connected:", socket.id);

  // Join room
  socket.on("joinRoom", ({ roomCode, name }) => {
    if (!rooms[roomCode]) {
      // Create new room, first user is host
      rooms[roomCode] = {
        hostId: socket.id,
        videoId: "",
        participants: [],
      };
    }

    const isHost = rooms[roomCode].hostId === socket.id;
    const user = { id: socket.id, name, isHost };
    rooms[roomCode].participants.push(user);

    socket.join(roomCode);

    socket.emit("joinedRoom", {
      videoId: rooms[roomCode].videoId,
      isHost,
      participants: rooms[roomCode].participants,
    });

    io.to(roomCode).emit("updateParticipants", rooms[roomCode].participants);
    io.to(roomCode).emit("systemMessage", `${name} joined the room`);
  });

  // Load video (host only)
  socket.on("loadVideo", ({ roomCode, videoId }) => {
    if (rooms[roomCode]?.hostId === socket.id) {
      rooms[roomCode].videoId = videoId;
      io.to(roomCode).emit("videoLoaded", videoId);
    }
  });

  // Sync play/pause
  socket.on("syncPlayback", ({ roomCode, action, time }) => {
    if (rooms[roomCode]?.hostId === socket.id) {
      socket.to(roomCode).emit("playbackSynced", { action, time });
    }
  });

  // Force re-sync
  socket.on("forceResync", ({ roomCode, time, state }) => {
    if (rooms[roomCode]?.hostId === socket.id) {
      io.to(roomCode).emit("resync", { time, state });
    }
  });

  // Chat
  socket.on("sendMessage", ({ roomCode, message }) => {
    const user = rooms[roomCode]?.participants.find((u) => u.id === socket.id);
    if (user) {
      io.to(roomCode).emit("messageReceived", { user, message });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const user = room.participants.find((p) => p.id === socket.id);

      if (user) {
        room.participants = room.participants.filter(
          (p) => p.id !== socket.id
        );

        io.to(roomCode).emit("updateParticipants", room.participants);
        io.to(roomCode).emit("systemMessage", `${user.name} left the room`);

        // If host left, promote a new host
        if (room.hostId === socket.id && room.participants.length > 0) {
          room.hostId = room.participants[0].id;
          io.to(room.hostId).emit("promoteToHost");
        }

        // Delete room if empty
        if (room.participants.length === 0) {
          delete rooms[roomCode];
        }
      }
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
