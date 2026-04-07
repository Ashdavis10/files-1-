import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Trophy, Flame, Clock, BookOpen, Target } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUser, updatePreferences } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', weeklyGoal: 600 });
  const [prefForm, setPrefForm] = useState({});
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, bio: user.bio || '', weeklyGoal: user.weeklyGoal || 600 });
      setPrefForm(user.preferences || {});
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [sessRes, anaRes] = await Promise.all([
        api.get('/sessions/history?limit=10&days=30'),
        api.get('/sessions/analytics?days=30')
      ]);
      setSessions(sessRes.data.sessions);
      setAnalytics(anaRes.data.analytics);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.user);
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload profile picture');
    }
  };

  const handlePrefSave = async () => {
    try {
      await updatePreferences(prefForm);
      toast.success('Preferences saved!');
    } catch { toast.error('Failed to save preferences'); }
  };

  const studyHours = ((user?.totalStudyTime || 0) / 60).toFixed(1);
  const avgSessionLength = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.duration, 0) / sessions.length)
    : 0;

  return (
    <AppLayout>
      <div className="profile-page">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          {!editing ? (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="profile-layout">
          {/* Left column */}
          <div className="profile-left">
            {/* Profile card */}
            <div className="card profile-card">
              <div className="profile-avatar-big" style={{ position: 'relative', overflow: 'hidden' }}>
                {user?.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL || 'https://studyhub-siol.onrender.com'}`.replace('/api', '') + user.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                ) : (
                  user?.username?.slice(0, 2).toUpperCase()
                )}
                {editing && (
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} 
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    title="Click to upload new profile picture" />
                )}
              </div>
              {editing && <p style={{fontSize: 10, textAlign: 'center', color: 'var(--text-muted)', marginTop: 4}}>Click avatar to change</p>}
              {editing ? (
                <div className="profile-edit-form">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-textarea" value={form.bio}
                      placeholder="Tell others about yourself..."
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      style={{ minHeight: 80 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weekly Goal (minutes)</label>
                    <input type="number" className="form-input" value={form.weeklyGoal}
                      onChange={e => setForm(p => ({ ...p, weeklyGoal: Number(e.target.value) }))} />
                    <span className="text-xs text-muted" style={{ marginTop: 4 }}>
                      = {(form.weeklyGoal / 60).toFixed(1)} hours / week
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="profile-name">{user?.username}</h2>
                  <p className="profile-email">{user?.email}</p>
                  {user?.bio && <p className="profile-bio">{user.bio}</p>}
                  <div className="profile-joined">
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : ''}
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="card">
              <h3 className="section-heading">Study Stats</h3>
              <div className="profile-stats">
                {[
                  { icon: '⏱', label: 'Total Hours', value: studyHours + 'h', color: 'var(--accent)' },
                  { icon: '📚', label: 'Sessions', value: user?.totalSessions || 0, color: 'var(--success)' },
                  { icon: '🔥', label: 'Streak', value: (user?.currentStreak || 0) + ' days', color: 'var(--warning)' },
                  { icon: '⚡', label: 'Best Streak', value: (user?.longestStreak || 0) + ' days', color: 'var(--info)' },
                  { icon: '⌛', label: 'Avg Session', value: avgSessionLength + 'm', color: 'var(--accent)' },
                  { icon: '🎯', label: 'Weekly Goal', value: (user?.weeklyGoal || 600) / 60 + 'h', color: 'var(--success)' },
                ].map(s => (
                  <div key={s.label} className="profile-stat">
                    <div className="profile-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                    <div className="profile-stat-value">{s.value}</div>
                    <div className="profile-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            {user?.badges?.length > 0 && (
              <div className="card">
                <h3 className="section-heading">Badges ({user.badges.length})</h3>
                <div className="profile-badges">
                  {user.badges.map((b, i) => (
                    <div key={i} className="profile-badge" title={b.description}>
                      <div className="profile-badge-icon">{b.icon}</div>
                      <div className="profile-badge-name">{b.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="profile-right">
            {/* Preferences */}
            <div className="card">
              <h3 className="section-heading">Preferences</h3>
              <div className="prefs-grid">
                {[
                  { key: 'pomodoroWork', label: 'Focus Duration (min)', type: 'number', min: 5, max: 120 },
                  { key: 'pomodoroBreak', label: 'Short Break (min)', type: 'number', min: 1, max: 30 },
                  { key: 'pomodoroLongBreak', label: 'Long Break (min)', type: 'number', min: 5, max: 60 },
                ].map(p => (
                  <div key={p.key} className="form-group">
                    <label className="form-label">{p.label}</label>
                    <input type={p.type} className="form-input"
                      min={p.min} max={p.max}
                      value={prefForm[p.key] || ''}
                      onChange={e => setPrefForm(prev => ({ ...prev, [p.key]: Number(e.target.value) }))} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3" style={{ marginTop: 16 }}>
                <span className="form-label" style={{ margin: 0 }}>Dark Mode</span>
                <button className={`toggle-btn ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme}>
                  <div className="toggle-knob" />
                </button>
                <span className="text-sm text-muted">{theme === 'dark' ? 'On' : 'Off'}</span>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handlePrefSave}>
                Save Preferences
              </button>
            </div>

            {/* Recent sessions */}
            <div className="card">
              <h3 className="section-heading">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-state-icon">📖</div>
                  <p>No sessions recorded yet</p>
                </div>
              ) : (
                <div className="sessions-table">
                  <div className="sessions-table-header">
                    <span>Subject</span>
                    <span>Duration</span>
                    <span>Type</span>
                    <span>Date</span>
                  </div>
                  {sessions.map(s => (
                    <div key={s._id} className="sessions-table-row">
                      <span className="font-bold" style={{ fontSize: 13 }}>{s.subject}</span>
                      <span className="badge badge-accent">{s.duration}m</span>
                      <span className="text-xs text-muted">{s.type}</span>
                      <span className="text-xs text-muted">{new Date(s.startTime).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
