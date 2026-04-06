const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

const connectedUsers = new Map(); // userId -> socketId
const roomTimers = new Map(); // roomId -> timer data

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);
    
    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    
    console.log(`🔗 User connected: ${socket.user.username} (${socket.id})`);

    // ── ROOM EVENTS ──

    // Join a study room
    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });
        
        socket.join(roomId);
        
        // Add to active users
        if (!room.activeUsers.includes(userId)) {
          room.activeUsers.push(userId);
          await room.save();
        }
        
        // Notify room
        socket.to(roomId).emit('user_joined', {
          userId,
          username: socket.user.username,
          avatar: socket.user.avatar,
          timestamp: new Date()
        });
        
        // Send system message
        io.to(roomId).emit('room_message', {
          type: 'system',
          content: `${socket.user.username} joined the room`,
          timestamp: new Date()
        });
        
        // Send active users list
        const updatedRoom = await Room.findById(roomId).populate('activeUsers', 'username avatar isOnline');
        io.to(roomId).emit('active_users_update', { activeUsers: updatedRoom.activeUsers });
        
        socket.roomId = roomId;
      } catch (error) {
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Leave a room
    socket.on('leave_room', async ({ roomId }) => {
      await handleLeaveRoom(socket, io, roomId);
    });

    // Send chat message
    socket.on('send_message', async ({ roomId, content }) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.length > 1000) return socket.emit('error', { message: 'Message too long' });
        
        const message = {
          user: socket.user._id,
          username: socket.user.username,
          content: content.trim(),
          type: 'text',
          timestamp: new Date()
        };
        
        // Save to DB
        await Room.findByIdAndUpdate(roomId, { $push: { messages: message } });
        
        // Broadcast to room
        io.to(roomId).emit('room_message', {
          ...message,
          avatar: socket.user.avatar
        });
      } catch (error) {
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', ({ roomId }) => {
      socket.to(roomId).emit('user_typing', { userId, username: socket.user.username });
    });

    socket.on('typing_stop', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing', { userId });
    });

    // ── POMODORO SYNC ──

    socket.on('pomodoro_sync', ({ roomId, timerState }) => {
      // Broadcast pomodoro state to room (for group sync)
      socket.to(roomId).emit('pomodoro_update', {
        userId,
        username: socket.user.username,
        timerState
      });
    });

    socket.on('pomodoro_start_group', ({ roomId, settings }) => {
      roomTimers.set(roomId, { ...settings, startedBy: socket.user.username, startedAt: new Date() });
      io.to(roomId).emit('group_pomodoro_start', {
        settings,
        startedBy: socket.user.username
      });
    });

    // ── STUDY SESSION EVENTS ──

    socket.on('session_start', ({ roomId }) => {
      if (roomId) {
        socket.to(roomId).emit('peer_session_started', {
          userId,
          username: socket.user.username
        });
      }
    });

    socket.on('session_end', ({ roomId, duration }) => {
      if (roomId) {
        socket.to(roomId).emit('peer_session_ended', {
          userId,
          username: socket.user.username,
          duration
        });
      }
    });

    // ── DISCONNECT ──

    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      
      // Leave any rooms
      if (socket.roomId) {
        await handleLeaveRoom(socket, io, socket.roomId);
      }
      
      console.log(`🔌 User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

async function handleLeaveRoom(socket, io, roomId) {
  try {
    const userId = socket.user._id.toString();
    socket.leave(roomId);
    
    // Remove from active users
    await Room.findByIdAndUpdate(roomId, {
      $pull: { activeUsers: socket.user._id }
    });
    
    // Notify room
    socket.to(roomId).emit('user_left', { userId, username: socket.user.username });
    
    io.to(roomId).emit('room_message', {
      type: 'system',
      content: `${socket.user.username} left the room`,
      timestamp: new Date()
    });
    
    // Update active users
    const updatedRoom = await Room.findById(roomId).populate('activeUsers', 'username avatar isOnline');
    if (updatedRoom) {
      io.to(roomId).emit('active_users_update', { activeUsers: updatedRoom.activeUsers });
    }
    
    socket.roomId = null;
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

module.exports = { initSocket };
