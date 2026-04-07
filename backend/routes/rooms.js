const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

// @GET /api/rooms - Get all public rooms
router.get('/', protect, async (req, res) => {
  try {
    const { subject, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true, isPrivate: false };
    
    if (subject && subject !== 'All') query.subject = subject;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const rooms = await Room.find(query)
      .populate('creator', 'username avatar')
      .populate('activeUsers', 'username avatar')
      .select('-messages -password')
      .sort({ 'activeUsers': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Room.countDocuments(query);
    
    res.json({
      success: true,
      rooms,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

// @POST /api/rooms - Create a room
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, subject, isPrivate, maxMembers, tags } = req.body;
    
    const room = await Room.create({
      name, description, subject, isPrivate, maxMembers, tags,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    
    await room.populate('creator', 'username avatar');
    
    res.status(201).json({ success: true, room });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Error creating room' });
  }
});

// @GET /api/rooms/:id - Get single room with messages
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar isOnline')
      .populate('activeUsers', 'username avatar isOnline')
      .populate('messages.user', 'username avatar');
    
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    // Limit messages to last 100
    room.messages = room.messages.slice(-100);
    
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching room' });
  }
});

// @POST /api/rooms/:id/join - Join a room
router.post('/:id/join', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    
    if (!isMember) {
      if (room.members.length >= room.maxMembers) {
        return res.status(400).json({ success: false, message: 'Room is full' });
      }
      room.members.push({ user: req.user._id, role: 'member' });
      await room.save();
    }
    
    res.json({ success: true, message: 'Joined room successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error joining room' });
  }
});

// @DELETE /api/rooms/:id/leave - Leave a room
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    room.members = room.members.filter(m => m.user.toString() !== req.user._id.toString());
    room.activeUsers = room.activeUsers.filter(u => u.toString() !== req.user._id.toString());
    await room.save();
    
    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error leaving room' });
  }
});

// @DELETE /api/rooms/:id/disband - Disband a room (creator only)
router.delete('/:id/disband', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    // Check if the user is the creator
    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can disband this room' });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room disbanded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error disbanding room' });
  }
});

// @GET /api/rooms/my/rooms - Get user's rooms
router.get('/my/rooms', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user._id,
      isActive: true
    })
    .populate('creator', 'username avatar')
    .populate('activeUsers', 'username avatar')
    .select('-messages')
    .sort({ updatedAt: -1 });
    
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching your rooms' });
  }
});

module.exports = router;
