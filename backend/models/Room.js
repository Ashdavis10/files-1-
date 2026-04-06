const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: ['text', 'system', 'file'], default: 'text' },
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Science', 'Programming', 'Languages', 'History', 'Arts', 'Business', 'Medicine', 'Law', 'Engineering', 'Other']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
  activeUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  isPrivate: { type: Boolean, default: false },
  password: { type: String, default: null, select: false },
  maxMembers: { type: Number, default: 20 },
  tags: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  totalSessions: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 }
}, { timestamps: true });

// Virtual for member count
roomSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for active user count
roomSchema.virtual('activeCount').get(function() {
  return this.activeUsers.length;
});

roomSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Room', roomSchema);
