import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Lock, Unlock, ArrowRight } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../styles/RoomsPage.css';

const SUBJECTS = ['All', 'Mathematics', 'Science', 'Programming', 'Languages', 'History', 'Arts', 'Business', 'Medicine', 'Law', 'Engineering', 'Other'];
const SUBJECT_COLORS = {
  Mathematics: '#7c6aff', Science: '#22c55e', Programming: '#38bdf8',
  Languages: '#f59e0b', History: '#a855f7', Arts: '#ff6b9d',
  Business: '#fb923c', Medicine: '#ef4444', Law: '#6366f1', Engineering: '#14b8a6', Other: '#64748b'
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('discover');
  const [form, setForm] = useState({
    name: '', description: '', subject: 'Programming',
    isPrivate: false, maxMembers: 20, tags: ''
  });

  useEffect(() => {
    loadRooms();
    loadMyRooms();
  }, [subject, search]);

  const loadRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (subject !== 'All') params.set('subject', subject);
      if (search) params.set('search', search);
      const { data } = await api.get(`/rooms?${params}`);
      setRooms(data.rooms);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  const loadMyRooms = async () => {
    try {
      const { data } = await api.get('/rooms/my/rooms');
      setMyRooms(data.rooms);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/rooms', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Room created!');
      setShowCreate(false);
      navigate(`/rooms/${data.room._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create room');
    }
  };

  const handleJoin = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/join`);
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to join room');
    }
  };

  const displayRooms = tab === 'my' ? myRooms : rooms;

  return (
    <AppLayout>
      <div className="rooms-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Study Rooms</h1>
            <p className="page-subtitle">Find your people. Study together.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Room
          </button>
        </div>

        {/* Tabs */}
        <div className="rooms-tabs">
          <button className={`rooms-tab ${tab === 'discover' ? 'active' : ''}`} onClick={() => setTab('discover')}>
            🌍 Discover Rooms
          </button>
          <button className={`rooms-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => { setTab('my'); loadMyRooms(); }}>
            📚 My Rooms ({myRooms.length})
          </button>
        </div>

        {tab === 'discover' && (
          <>
            {/* Search & Filter */}
            <div className="rooms-filters">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input padded-input"
                  placeholder="Search rooms..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="subject-filters">
                {SUBJECTS.map(s => (
                  <button key={s} className={`subject-pill ${subject === s ? 'active' : ''}`}
                    onClick={() => setSubject(s)}
                    style={{ '--pill-color': SUBJECT_COLORS[s] || 'var(--accent)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Rooms grid */}
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}>
            <div className="loading-spinner" />
          </div>
        ) : displayRooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏫</div>
            <h3>{tab === 'my' ? 'No rooms joined yet' : 'No rooms found'}</h3>
            <p>{tab === 'my' ? 'Join or create a room to get started' : 'Try a different search or create a new room'}</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create a Room
            </button>
          </div>
        ) : (
          <div className="grid-auto">
            {displayRooms.map(room => (
              <RoomCard key={room._id} room={room} onJoin={handleJoin} subjectColors={SUBJECT_COLORS} />
            ))}
          </div>
        )}

        {/* Create Room Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Create Study Room</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Room Name *</label>
                  <input className="form-input" placeholder="e.g. CS101 Study Group"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="What will you study?"
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    style={{ minHeight: 80 }} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select className="form-select" value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      {SUBJECTS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Members</label>
                    <input type="number" className="form-input" min="2" max="50"
                      value={form.maxMembers} onChange={e => setForm(p => ({ ...p, maxMembers: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" placeholder="calculus, exam-prep, midterm"
                    value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2" style={{ padding: '12px 0' }}>
                  <input type="checkbox" id="private" checked={form.isPrivate}
                    onChange={e => setForm(p => ({ ...p, isPrivate: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                  <label htmlFor="private" style={{ fontSize: 14, cursor: 'pointer' }}>
                    Private room (invite only)
                  </label>
                </div>
                <div className="flex gap-2" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary w-full" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full">Create Room</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function RoomCard({ room, onJoin, subjectColors }) {
  const navigate = useNavigate();
  const color = subjectColors[room.subject] || 'var(--accent)';
  const activeCount = room.activeUsers?.length || 0;

  return (
    <div className="room-card" style={{ '--room-color': color }}>
      <div className="room-card-header">
        <div className="room-subject-dot" style={{ background: color }} />
        <span className="room-subject">{room.subject}</span>
        {room.isPrivate ? <Lock size={12} /> : <Unlock size={12} color="var(--text-muted)" />}
        {activeCount > 0 && (
          <div className="room-live">
            <div className="live-dot" /> LIVE
          </div>
        )}
      </div>
      <h3 className="room-name">{room.name}</h3>
      {room.description && <p className="room-desc">{room.description}</p>}
      {room.tags?.length > 0 && (
        <div className="room-tags">
          {room.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}
      <div className="room-footer">
        <div className="flex items-center gap-2 text-muted text-sm">
          <Users size={14} />
          <span>{room.memberCount || 0} / {room.maxMembers}</span>
          {activeCount > 0 && <span style={{ color: 'var(--success)' }}>· {activeCount} online</span>}
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => onJoin(room._id)}>
          Join <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
