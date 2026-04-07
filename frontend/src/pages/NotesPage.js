import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, FileText, Link, Upload, Heart,
  Trash2, Eye, Download, ExternalLink, X, Tag
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/NotesPage.css';

const TYPE_ICONS = { note: '📝', link: '🔗', file: '📁' };
const SUBJECTS = ['General', 'Mathematics', 'Science', 'Programming', 'Languages', 'History', 'Arts', 'Business', 'Medicine', 'Law', 'Engineering'];

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [form, setForm] = useState({
    title: '', content: '', type: 'note', url: '',
    subject: 'General', tags: '', isPublic: false
  });
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadNotes(); }, [search, typeFilter]);

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const { data } = await api.get(`/notes?${params}`);
      setNotes(data.notes);
    } catch { toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v));
      if (file) fd.append('file', file);
      fd.set('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Note created!');
      setShowCreate(false);
      setForm({ title: '', content: '', type: 'note', url: '', subject: 'General', tags: '', isPublic: false });
      setFile(null);
      loadNotes();
    } catch (err) {
      toast.error(err.message || 'Failed to create note');
    }
  };

  const handleLike = async (noteId) => {
    try {
      const { data } = await api.put(`/notes/${noteId}/like`);
      setNotes(prev => prev.map(n => n._id === noteId
        ? { ...n, likes: Array(data.likes).fill(null), liked: data.liked }
        : n));
    } catch {}
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n._id !== noteId));
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <AppLayout>
      <div className="notes-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Notes & Resources</h1>
            <p className="page-subtitle">Share and discover study materials</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Resource
          </button>
        </div>

        {/* Filters */}
        <div className="notes-filters">
          <div className="input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="input-icon" />
            <input type="text" className="form-input padded-input"
              placeholder="Search notes..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="type-filters">
            {[
              { key: 'all', label: '📚 All' },
              { key: 'note', label: '📝 Notes' },
              { key: 'link', label: '🔗 Links' },
              { key: 'file', label: '📁 Files' }
            ].map(f => (
              <button key={f.key} className={`type-pill ${typeFilter === f.key ? 'active' : ''}`}
                onClick={() => setTypeFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Notes grid */}
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 300 }}>
            <div className="loading-spinner" />
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Create your first note or share a resource</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add Resource
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => (
              <NoteCard
                key={note._id}
                note={note}
                currentUserId={user._id}
                onLike={() => handleLike(note._id)}
                onDelete={() => handleDelete(note._id)}
                onView={() => setSelectedNote(note)}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Add Resource</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
              </div>

              {/* Type selector */}
              <div className="type-selector">
                {[
                  { key: 'note', icon: '📝', label: 'Note' },
                  { key: 'link', icon: '🔗', label: 'Link' },
                  { key: 'file', icon: '📁', label: 'File Upload' }
                ].map(t => (
                  <button key={t.key}
                    className={`type-option ${form.type === t.key ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, type: t.key }))}>
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" placeholder="Resource title"
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>

                {form.type === 'note' && (
                  <div className="form-group">
                    <label className="form-label">Content</label>
                    <textarea className="form-textarea" placeholder="Write your notes here..."
                      value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      style={{ minHeight: 120 }} />
                  </div>
                )}

                {form.type === 'link' && (
                  <div className="form-group">
                    <label className="form-label">URL *</label>
                    <input type="url" className="form-input" placeholder="https://..."
                      value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required />
                  </div>
                )}

                {form.type === 'file' && (
                  <div className="form-group">
                    <label className="form-label">File</label>
                    <div className="file-drop" onClick={() => fileRef.current.click()}>
                      <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files[0])} />
                      {file ? (
                        <div>
                          <div style={{ fontSize: 24 }}>📁</div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} color="var(--text-muted)" />
                          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
                            Click to upload (max 10MB)
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            PDF, DOC, PPT, images, ZIP
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-select" value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <input className="form-input" placeholder="tag1, tag2"
                      value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="public" checked={form.isPublic}
                    onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                  <label htmlFor="public" style={{ fontSize: 14, cursor: 'pointer' }}>
                    Make public (visible to all users)
                  </label>
                </div>

                <div className="flex gap-2" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary w-full" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full">Save Resource</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Note Modal */}
        {selectedNote && (
          <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
            <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{TYPE_ICONS[selectedNote.type]} {selectedNote.title}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedNote(null)}><X size={18} /></button>
              </div>
              <div className="note-view">
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-accent">{selectedNote.subject}</span>
                  {selectedNote.isPublic && <span className="badge badge-success">Public</span>}
                </div>
                {selectedNote.content && (
                  <div className="note-content-view">{selectedNote.content}</div>
                )}
                {selectedNote.url && (
                  <a href={selectedNote.url} target="_blank" rel="noreferrer" className="btn btn-secondary w-full">
                    <ExternalLink size={14} /> Open Link
                  </a>
                )}
                {selectedNote.fileUrl && (
                  <a href={`http://localhost:5000${selectedNote.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary w-full">
                    <Download size={14} /> Download {selectedNote.fileName}
                  </a>
                )}
                {selectedNote.tags?.length > 0 && (
                  <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
                    {selectedNote.tags.map(t => <span key={t} className="tag"><Tag size={10} /> {t}</span>)}
                  </div>
                )}
                <div className="note-meta-footer">
                  <span>By {selectedNote.author?.username}</span>
                  <span>·</span>
                  <span>{new Date(selectedNote.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function NoteCard({ note, currentUserId, onLike, onDelete, onView }) {
  const isOwn = note.author?._id === currentUserId;
  const likeCount = note.likes?.length || 0;

  return (
    <div className="note-card" onClick={onView}>
      <div className="note-card-header">
        <span className="note-type-icon">{TYPE_ICONS[note.type] || '📝'}</span>
        <span className="note-subject-tag">{note.subject}</span>
        {note.isPublic && <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px' }}>Public</span>}
        {isOwn && (
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto', padding: 4 }}
            onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 size={14} color="var(--danger)" />
          </button>
        )}
      </div>

      <h3 className="note-title">{note.title}</h3>

      {note.content && (
        <p className="note-preview">{note.content.slice(0, 120)}{note.content.length > 120 ? '...' : ''}</p>
      )}

      {note.url && (
        <div className="note-link-preview">
          <Link size={12} />
          <span>{note.url.replace(/^https?:\/\//, '').slice(0, 50)}...</span>
        </div>
      )}

      {note.fileName && (
        <div className="note-file-preview">
          <Upload size={12} />
          <span>{note.fileName}</span>
        </div>
      )}

      {note.tags?.length > 0 && (
        <div className="note-tags">
          {note.tags.slice(0, 3).map(t => <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>)}
        </div>
      )}

      <div className="note-footer">
        <div className="note-author">
          <div className="user-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
            {note.author?.username?.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-muted">{note.author?.username}</span>
        </div>
        <button className="like-btn" onClick={e => { e.stopPropagation(); onLike(); }}>
          <Heart size={13} fill={note.liked ? 'var(--danger)' : 'none'} color={note.liked ? 'var(--danger)' : 'var(--text-muted)'} />
          <span>{likeCount}</span>
        </button>
      </div>
    </div>
  );
}
