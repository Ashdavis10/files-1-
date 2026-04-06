const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['note', 'link', 'file'],
    default: 'note'
  },
  url: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  subject: {
    type: String,
    default: 'General'
  },
  tags: [{ type: String, trim: true }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ room: 1, createdAt: -1 });
noteSchema.index({ isPublic: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
