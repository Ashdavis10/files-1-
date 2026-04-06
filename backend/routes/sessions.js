const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @POST /api/sessions/start - Start a session
router.post('/start', protect, async (req, res) => {
  try {
    const { roomId, type = 'solo', subject = 'General' } = req.body;
    
    // End any existing active sessions
    await Session.updateMany(
      { user: req.user._id, isCompleted: false },
      { isCompleted: true, endTime: new Date() }
    );
    
    const session = await Session.create({
      user: req.user._id,
      room: roomId || null,
      type,
      subject,
      startTime: new Date()
    });
    
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error starting session' });
  }
});

// @PUT /api/sessions/:id/end - End a session
router.put('/:id/end', protect, async (req, res) => {
  try {
    const { productivity, notes, pomodoroStats } = req.body;
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const endTime = new Date();
    const duration = Math.floor((endTime - session.startTime) / (1000 * 60));
    
    session.endTime = endTime;
    session.duration = duration;
    session.isCompleted = true;
    if (productivity) session.productivity = productivity;
    if (notes) session.notes = notes;
    if (pomodoroStats) session.pomodoroStats = pomodoroStats;
    
    await session.save();
    
    // Update user stats
    const user = await User.findById(req.user._id);
    user.totalStudyTime += duration;
    user.totalSessions += 1;
    user.updateStreak();
    
    // Award badges
    const badges = [];
    if (user.totalSessions === 1) badges.push({ name: 'First Step', description: 'Completed your first study session!', icon: '🎯' });
    if (user.totalSessions === 10) badges.push({ name: 'Dedicated', description: 'Completed 10 study sessions!', icon: '📚' });
    if (user.totalSessions === 50) badges.push({ name: 'Scholar', description: 'Completed 50 study sessions!', icon: '🎓' });
    if (user.currentStreak === 7) badges.push({ name: 'Week Warrior', description: '7-day study streak!', icon: '🔥' });
    if (user.currentStreak === 30) badges.push({ name: 'Monthly Master', description: '30-day study streak!', icon: '⚡' });
    if (user.totalStudyTime >= 600) badges.push({ name: 'Ten Hour Club', description: 'Studied 10 hours total!', icon: '⏰' });
    
    const existingBadgeNames = user.badges.map(b => b.name);
    const newBadges = badges.filter(b => !existingBadgeNames.includes(b.name));
    user.badges.push(...newBadges);
    
    await user.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      session,
      userStats: {
        totalStudyTime: user.totalStudyTime,
        totalSessions: user.totalSessions,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      },
      newBadges
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error ending session' });
  }
});

// @GET /api/sessions/history - Get session history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    const sessions = await Session.find({
      user: req.user._id,
      isCompleted: true,
      startTime: { $gte: startDate }
    })
    .populate('room', 'name subject')
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
    
    const total = await Session.countDocuments({
      user: req.user._id,
      isCompleted: true,
      startTime: { $gte: startDate }
    });
    
    res.json({ success: true, sessions, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching session history' });
  }
});

// @GET /api/sessions/analytics - Get analytics data
router.get('/analytics', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Daily study time over past N days
    const dailyData = await Session.aggregate([
      {
        $match: {
          user: req.user._id,
          isCompleted: true,
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalMinutes: { $sum: '$duration' },
          sessionCount: { $sum: 1 },
          avgProductivity: { $avg: '$productivity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Subject distribution
    const subjectData = await Session.aggregate([
      {
        $match: { user: req.user._id, isCompleted: true, startTime: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$subject',
          totalMinutes: { $sum: '$duration' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalMinutes: -1 } }
    ]);
    
    // Weekly summary
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weeklyStats = await Session.aggregate([
      {
        $match: { user: req.user._id, isCompleted: true, startTime: { $gte: weekStart } }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' },
          sessionCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    res.json({
      success: true,
      analytics: {
        daily: dailyData,
        subjects: subjectData,
        weekly: weeklyStats[0] || { totalMinutes: 0, sessionCount: 0, avgDuration: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
});

module.exports = router;
