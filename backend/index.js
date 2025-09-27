const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://localhost:5173"], // Your Vite/React dev server
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // In-memory store for room data

io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomCode, name }) => {
    // NEW: Basic validation
    if (!name || !roomCode) {
        socket.emit('roomError', 'Name and Room Code are required.');
        return;
    }

    socket.join(roomCode);
    // IMPROVED: Store room and name on the socket object for easy access later
    socket.roomCode = roomCode;
    socket.username = name;

    // Create room if it doesn't exist
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        participants: [],
        videoId: null, // Start with no video
      };
    }

    const isHost = rooms[roomCode].participants.length === 0;
    const newParticipant = { id: socket.id, name, isHost };
    rooms[roomCode].participants.push(newParticipant);

    console.log(`[${roomCode}]: ${name} (${socket.id}) joined.`);

    // NEW: Notify existing users that someone has joined
    socket.to(roomCode).emit('systemMessage', `${name} has joined the room!`);

    // Send room data to the newly joined user
    socket.emit('joinedRoom', {
      videoId: rooms[roomCode].videoId,
      isHost,
      participants: rooms[roomCode].participants
    });

    // Update the participant list for everyone in the room
    io.to(roomCode).emit('updateParticipants', rooms[roomCode].participants);
  });

  socket.on('loadVideo', ({ roomCode, videoId }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].videoId = videoId;
      // Use io.to() to inform everyone, including the host
      io.to(roomCode).emit('videoLoaded', videoId);
    }
  });

  socket.on('syncPlayback', ({ roomCode, action, time }) => {
    // Send to everyone except the sender (the host)
    socket.to(roomCode).emit('playbackSynced', { action, time });
  });

  // CHANGED: This logic is now correct according to the front-end
  socket.on('forceResync', ({ roomCode, time, state }) => {
    console.log(`[${roomCode}]: Host initiated re-sync to ${time}s with state: ${state}`);
    // Emit a 'resync' event to EVERYONE (including the host) to ensure all are aligned
    io.to(roomCode).emit('resync', { time, state });
  });

  socket.on('sendMessage', ({ roomCode, message }) => {
    // Use the stored username for reliability
    const sender = rooms[roomCode]?.participants.find(p => p.id === socket.id);
    if (sender) {
      io.to(roomCode).emit('messageReceived', { user: sender, message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
    // IMPROVED: Efficiently find and remove user without looping through all rooms
    const { roomCode, username } = socket;

    if (roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const participant = room.participants.find(p => p.id === socket.id);

        if (participant) {
            // Remove the participant
            room.participants = room.participants.filter(p => p.id !== socket.id);
            console.log(`[${roomCode}]: ${username} (${socket.id}) left.`);

            // NEW: Notify remaining users
            io.to(roomCode).emit('systemMessage', `${username} has left the room.`);

            // If the host left, assign a new one
            if (participant.isHost && room.participants.length > 0) {
                room.participants[0].isHost = true;
                console.log(`[${roomCode}]: New host is ${room.participants[0].name}`);
                // NEW: Notify the newly promoted user specifically so they can update their UI state
                io.to(room.participants[0].id).emit('promoteToHost');
            }
            
            // If the room is empty, delete it
            if(room.participants.length === 0){
                console.log(`[${roomCode}]: Room is empty, deleting.`);
                delete rooms[roomCode];
            } else {
                // Otherwise, just update the participant list for everyone remaining
                io.to(roomCode).emit('updateParticipants', room.participants);
            }
        }
    }
  });
});
app.get('/' , (req,res) => {
    res.send("hii biswajit")
})

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});