import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Flame, BookOpen, Target, Play, TrendingUp,
  Award, Users, Plus, ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const chartDefaults = {
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'var(--bg-card)',
      titleColor: 'var(--text-primary)',
      bodyColor: 'var(--text-secondary)',
      borderColor: 'var(--border)',
      borderWidth: 1,
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'var(--text-muted)', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'var(--text-muted)', font: { size: 11 } } }
  }
};

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    loadData();
    // Check for active session
    const savedSession = localStorage.getItem('active_session');
    if (savedSession) setActiveSession(JSON.parse(savedSession));
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.get('/sessions/analytics?days=14'),
        api.get('/sessions/history?limit=5')
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setSessions(sessionsRes.data.sessions);
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const { data } = await api.post('/sessions/start', { type: 'solo', subject: 'General' });
      setActiveSession(data.session);
      toast.success('Study session started!');
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    try {
      const { data } = await api.put(`/sessions/${activeSession._id}/end`, { productivity: 4 });
      setActiveSession(null);
      localStorage.removeItem('active_session');
      updateUser(data.userStats);
      if (data.newBadges?.length > 0) {
        setNewBadges(data.newBadges);
        data.newBadges.forEach(b => toast.success(`Badge earned: ${b.name}!`, { duration: 5000 }));
      }
      toast.success(`Session complete! ${data.session.duration} minutes studied`);
      loadData();
    } catch (err) {
      toast.error('Failed to end session');
    }
  };

  const studyHours = ((user?.totalStudyTime || 0) / 60).toFixed(1);
  const weeklyProgress = analytics?.weekly?.totalMinutes || 0;
  const weeklyGoal = user?.weeklyGoal || 600;
  const weeklyPct = Math.min(Math.round((weeklyProgress / weeklyGoal) * 100), 100);

  // Chart data
  const dailyLabels = analytics?.daily?.map(d => {
    const date = new Date(d._id);
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  }) || [];

  const barData = {
    labels: dailyLabels,
    datasets: [{
      data: analytics?.daily?.map(d => Math.round(d.totalMinutes / 60 * 10) / 10) || [],
      backgroundColor: 'rgba(124, 106, 255, 0.6)',
      borderColor: 'rgba(124, 106, 255, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const subjectColors = ['#7c6aff', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a855f7'];
  const doughnutData = {
    labels: analytics?.subjects?.map(s => s._id) || [],
    datasets: [{
      data: analytics?.subjects?.map(s => s.totalMinutes) || [],
      backgroundColor: subjectColors,
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <AppLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} 👋
            </h1>
            <p className="page-subtitle">
              {activeSession ? '🔴 Session in progress' : `You've studied ${studyHours} hours total`}
            </p>
          </div>
          <div className="flex gap-2">
            {activeSession ? (
              <button className="btn btn-danger" onClick={endSession}>
                ⏹ End Session
              </button>
            ) : (
              <button className="btn btn-primary" onClick={startSession}>
                <Play size={16} /> Start Session
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/rooms')}>
              <Users size={16} /> Find Rooms
            </button>
          </div>
        </div>

        {/* Active session banner */}
        {activeSession && (
          <div className="active-session-banner">
            <div className="session-dot" />
            <span>Study session active since {new Date(activeSession.startTime).toLocaleTimeString()}</span>
            <button onClick={endSession} className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }}>End</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid-4 mb-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}><Clock size={20} /></div>
            <div className="stat-value">{studyHours}h</div>
            <div className="stat-label">Total Study Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}><BookOpen size={20} /></div>
            <div className="stat-value">{user?.totalSessions || 0}</div>
            <div className="stat-label">Sessions Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-dim)', color: 'var(--warning)' }}><Flame size={20} /></div>
            <div className="stat-value">{user?.currentStreak || 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-dim)', color: 'var(--info)' }}><Award size={20} /></div>
            <div className="stat-value">{user?.badges?.length || 0}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2 mb-4">
          {/* Daily hours bar chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="chart-title">Study Hours</h3>
                <p className="text-muted text-sm">Last 14 days</p>
              </div>
              <TrendingUp size={20} color="var(--accent)" />
            </div>
            {analytics?.daily?.length > 0 ? (
              <Bar data={barData} options={{ ...chartDefaults, maintainAspectRatio: true, aspectRatio: 2 }} />
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p>No data yet. Start a study session!</p>
              </div>
            )}
          </div>

          {/* Subject breakdown doughnut */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="chart-title">By Subject</h3>
                <p className="text-muted text-sm">Time distribution</p>
              </div>
              <BookOpen size={20} color="var(--success)" />
            </div>
            {analytics?.subjects?.length > 0 ? (
              <div className="doughnut-wrapper">
                <Doughnut data={doughnutData} options={{
                  maintainAspectRatio: true, aspectRatio: 1.5,
                  plugins: { legend: { display: true, position: 'right', labels: { color: 'var(--text-secondary)', font: { size: 12 }, padding: 16 } }, tooltip: chartDefaults.plugins.tooltip }
                }} />
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p>No sessions recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly goal + recent sessions */}
        <div className="grid-2 mb-4">
          {/* Weekly goal */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-title">Weekly Goal</h3>
              <Target size={20} color="var(--warning)" />
            </div>
            <div className="weekly-goal">
              <div className="goal-ring-wrapper">
                <svg viewBox="0 0 120 120" className="goal-ring">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke="var(--accent)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - weeklyPct / 100)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                  <text x="60" y="55" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="800">{weeklyPct}%</text>
                  <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="10">of goal</text>
                </svg>
              </div>
              <div className="goal-info">
                <div className="goal-stat">
                  <span className="goal-val">{Math.round(weeklyProgress / 60 * 10) / 10}h</span>
                  <span className="goal-key">This week</span>
                </div>
                <div className="goal-stat">
                  <span className="goal-val">{Math.round(weeklyGoal / 60)}h</span>
                  <span className="goal-key">Weekly goal</span>
                </div>
                <div className="goal-stat">
                  <span className="goal-val">{analytics?.weekly?.sessionCount || 0}</span>
                  <span className="goal-key">Sessions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-title">Recent Sessions</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon"><BookOpen size={36} opacity={0.5} /></div>
                <p>No sessions yet</p>
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map(s => (
                  <div key={s._id} className="session-item">
                    <div className="session-icon"><BookOpen size={16} /></div>
                    <div className="session-info">
                      <div className="session-subject">{s.subject}</div>
                      <div className="session-meta text-muted text-xs">
                        {new Date(s.startTime).toLocaleDateString()} · {s.type}
                      </div>
                    </div>
                    <div className="session-duration badge badge-accent">
                      {s.duration}m
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {user?.badges?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-title">Badges Earned</h3>
              <Award size={20} color="var(--warning)" />
            </div>
            <div className="badges-grid">
              {user.badges.map((badge, i) => (
                <div key={i} className="badge-card">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="quick-actions mt-4">
          <h3 className="chart-title mb-4">Quick Actions</h3>
          <div className="grid-3">
            {[
              { icon: <Clock size={20} />, label: 'Pomodoro Timer', sub: 'Start a focus session', path: '/pomodoro', color: 'var(--warning)' },
              { icon: <Users size={20} />, label: 'Find Study Room', sub: 'Collaborate live', path: '/rooms', color: 'var(--accent)' },
              { icon: <BookOpen size={20} />, label: 'Add Notes', sub: 'Share resources', path: '/notes', color: 'var(--success)' },
            ].map(a => (
              <button key={a.path} className="quick-action-card" onClick={() => navigate(a.path)}>
                <div className="quick-action-icon" style={{ color: a.color }}>{a.icon}</div>
                <div className="quick-action-label">{a.label}</div>
                <div className="quick-action-sub">{a.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
