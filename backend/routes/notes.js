const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg|gif|zip|pptx|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('File type not supported'));
  }
});

// @GET /api/notes - Get notes
router.get('/', protect, async (req, res) => {
  try {
    const { room, type, subject, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (room) query.room = room;
    else query.$or = [{ author: req.user._id }, { isPublic: true }];
    
    if (type) query.type = type;
    if (subject) query.subject = subject;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    const notes = await Note.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Note.countDocuments(query);
    
    res.json({ success: true, notes, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notes' });
  }
});

// @POST /api/notes - Create a note
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, content, type = 'note', url, subject, tags, room, isPublic } = req.body;
    
    const noteData = {
      title, content, type, subject,
      author: req.user._id,
      room: room || null,
      isPublic: isPublic === 'true' || isPublic === true,
      tags: tags ? JSON.parse(tags) : []
    };
    
    if (type === 'link') noteData.url = url;
    if (req.file) {
      noteData.fileUrl = `/uploads/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
      noteData.fileSize = req.file.size;
    }
    
    const note = await Note.create(noteData);
    await note.populate('author', 'username avatar');
    
    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating note' });
  }
});

// @PUT /api/notes/:id/like - Toggle like
router.put('/:id/like', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    const likeIndex = note.likes.indexOf(req.user._id);
    if (likeIndex === -1) note.likes.push(req.user._id);
    else note.likes.splice(likeIndex, 1);
    
    await note.save();
    res.json({ success: true, likes: note.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
});

// @DELETE /api/notes/:id - Delete note
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, author: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found or not authorized' });
    
    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
});

module.exports = router;
