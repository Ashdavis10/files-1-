import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, BookOpen, Target, Users, Plus, ChevronRight } from 'lucide-react';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('studyhub_user') || '{}');

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Welcome back, {user.username || 'Student'}! 👋</h1>
          <p>Ready to continue your learning journey?</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <Flame className="stat-icon" />
            <div>
              <div className="stat-number">{user.currentStreak || 0}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
          <div className="stat-card">
            <Clock className="stat-icon" />
            <div>
              <div className="stat-number">{Math.floor((user.totalStudyTime || 0) / 60)}h</div>
              <div className="stat-label">Total Study</div>
            </div>
          </div>
          <div className="stat-card">
            <BookOpen className="stat-icon" />
            <div>
              <div className="stat-number">{user.sessionsCompleted || 0}</div>
              <div className="stat-label">Sessions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="action-grid">
            <Link to="/rooms" className="action-card">
              <Users className="action-icon" />
              <h3>Study Rooms</h3>
              <p>Join or create study rooms</p>
              <ChevronRight className="action-arrow" />
            </Link>
            
            <Link to="/pomodoro" className="action-card">
              <Clock className="action-icon" />
              <h3>Pomodoro Timer</h3>
              <p>Start a focused study session</p>
              <ChevronRight className="action-arrow" />
            </Link>
            
            <Link to="/notes" className="action-card">
              <BookOpen className="action-icon" />
              <h3>My Notes</h3>
              <p>Access your study notes</p>
              <ChevronRight className="action-arrow" />
            </Link>
            
            <Link to="/leaderboard" className="action-card">
              <Target className="action-icon" />
              <h3>Leaderboard</h3>
              <p>See top performers</p>
              <ChevronRight className="action-arrow" />
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-icon">📚</div>
              <div className="activity-content">
                <p>Welcome to StudyHub! Start by joining a study room or creating your own.</p>
                <span className="activity-time">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
