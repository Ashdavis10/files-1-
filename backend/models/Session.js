const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  type: {
    type: String,
    enum: ['solo', 'group', 'pomodoro'],
    default: 'solo'
  },
  subject: {
    type: String,
    default: 'General'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  pomodoroStats: {
    completedPomodoros: { type: Number, default: 0 },
    totalWork: { type: Number, default: 0 }, // minutes
    totalBreak: { type: Number, default: 0 } // minutes
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  productivity: {
    type: Number,
    min: 1,
    max: 5,
    default: null // User self-rating
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for analytics queries
sessionSchema.index({ user: 1, startTime: -1 });
sessionSchema.index({ user: 1, isCompleted: 1 });

module.exports = mongoose.model('Session', sessionSchema);
