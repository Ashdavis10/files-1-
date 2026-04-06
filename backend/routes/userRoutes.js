const express = require('express');
const userRouter = express.Router();
const leaderboardRouter = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Users routes
// @PUT /api/users/profile - Update profile
userRouter.put('/profile', protect, async (req, res) => {
  try {
    const { username, bio, avatar, weeklyGoal } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (weeklyGoal) updates.weeklyGoal = weeklyGoal;
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Username already taken' });
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// @GET /api/users/:id - Get user profile
userRouter.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// Leaderboard routes
// @GET /api/leaderboard - Get leaderboard
leaderboardRouter.get('/', protect, async (req, res) => {
  try {
    const { type = 'weekly', limit = 10 } = req.query;
    let sortField = 'totalStudyTime';
    let matchQuery = {};
    
    if (type === 'streak') sortField = 'currentStreak';
    else if (type === 'sessions') sortField = 'totalSessions';
    else if (type === 'weekly') {
      // Get users who studied this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      matchQuery.lastStudyDate = { $gte: weekStart };
    }
    
    const users = await User.find(matchQuery)
      .select('username avatar totalStudyTime totalSessions currentStreak longestStreak badges')
      .sort({ [sortField]: -1 })
      .limit(Number(limit));
    
    // Find current user's rank
    const totalUsers = await User.countDocuments(matchQuery);
    const userRank = await User.countDocuments({
      ...matchQuery,
      [sortField]: { $gt: (await User.findById(req.user._id))[sortField] }
    });
    
    res.json({
      success: true,
      leaderboard: users.map((u, idx) => ({
        rank: idx + 1,
        user: {
          id: u._id,
          username: u.username,
          avatar: u.avatar,
          totalStudyTime: u.totalStudyTime,
          totalSessions: u.totalSessions,
          currentStreak: u.currentStreak,
          longestStreak: u.longestStreak,
          badgeCount: u.badges.length
        }
      })),
      userRank: userRank + 1,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
});

module.exports = { userRouter, leaderboardRouter };
