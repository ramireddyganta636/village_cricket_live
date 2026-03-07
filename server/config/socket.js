const socketio = require('socket.io');

let io;
const users = {};

const initSocket = (server) => {
  io = socketio(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinMatch', (matchId) => {
      socket.join(`match_${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };