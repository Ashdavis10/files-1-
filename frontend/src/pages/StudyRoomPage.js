import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Users, BookOpen, ArrowLeft, Timer, X } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/StudyRoomPage.css';

export default function StudyRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom, leaveRoom, sendMessage, sendTyping, on, off } = useSocket();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [tab, setTab] = useState('chat');

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    loadRoom();
    return () => { leaveRoom(id); };
  }, [id]);

  useEffect(() => {
    // Socket event listeners
    on('room_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    on('active_users_update', ({ activeUsers }) => {
      setActiveUsers(activeUsers);
    });
    on('user_typing', ({ userId, username }) => {
      if (userId !== user._id) {
        setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      }
    });
    on('user_stop_typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u !== userId));
    });

    return () => {
      off('room_message');
      off('active_users_update');
      off('user_typing');
      off('user_stop_typing');
    };
  }, [id, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}`);
      setRoom(data.room);
      setMessages(data.room.messages || []);
      setActiveUsers(data.room.activeUsers || []);
      joinRoom(id);
    } catch {
      toast.error('Room not found');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage(id, message.trim());
    setMessage('');
    sendTyping(id, false);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    sendTyping(id, true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(id, false), 2000);
  };

  const handleLeave = async () => {
    try {
      await api.delete(`/rooms/${id}/leave`);
      leaveRoom(id);
      navigate('/rooms');
    } catch {
      navigate('/rooms');
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="loading-screen" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    </AppLayout>
  );

  if (!room) return null;

  return (
    <AppLayout>
      <div className="study-room">
        {/* Header */}
        <div className="room-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rooms')}>
            <ArrowLeft size={16} /> Rooms
          </button>
          <div className="room-header-info">
            <h1 className="room-title">{room.name}</h1>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                {activeUsers.length} online
              </span>
              <span className="badge badge-accent">{room.subject}</span>
            </div>
          </div>
          <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pomodoro')}>
              <Timer size={14} /> Timer
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleLeave}>
              <X size={14} /> Leave
            </button>
          </div>
        </div>

        {/* Room body */}
        <div className="room-body">
          {/* Chat area */}
          <div className="chat-area">
            {/* Tab switcher */}
            <div className="chat-tabs">
              <button className={`chat-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                💬 Chat
              </button>
              <button className={`chat-tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>
                📝 Notes
              </button>
            </div>

            {/* Messages */}
            <div className="messages-list">
              {messages.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="empty-state-icon">💬</div>
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} isOwn={msg.username === user.username} />
              ))}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                  <span className="typing-text">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                className="form-input"
                placeholder="Type a message..."
                value={message}
                onChange={handleTyping}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-icon" disabled={!message.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Members sidebar */}
          <div className="room-sidebar">
            <div className="card">
              <h3 className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                <Users size={16} />
                Members ({room.members?.length || 0})
              </h3>
              <div className="members-list">
                {room.members?.map(m => (
                  <MemberItem
                    key={m.user?._id || m._id}
                    member={m}
                    isActive={activeUsers.some(u => u._id === (m.user?._id || m._id))}
                    currentUserId={user._id}
                  />
                ))}
              </div>
            </div>

            {room.description && (
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>About</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{room.description}</p>
              </div>
            )}

            {room.tags?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Tags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {room.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChatMessage({ msg, isOwn }) {
  if (msg.type === 'system') {
    return (
      <div className="system-message">
        <span>{msg.content}</span>
      </div>
    );
  }
  return (
    <div className={`chat-message ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <div className="user-avatar" style={{ fontSize: 12, width: 30, height: 30 }}>
          {msg.username?.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="message-content-wrap">
        {!isOwn && <div className="message-username">{msg.username}</div>}
        <div className="message-bubble">
          {msg.content}
        </div>
        <div className="message-time">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function MemberItem({ member, isActive, currentUserId }) {
  const u = member.user || member;
  const name = u?.username || 'Unknown';
  const isYou = u?._id === currentUserId;

  return (
    <div className="member-item">
      <div className="member-avatar-wrap">
        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className={`online-indicator ${isActive ? 'active' : ''}`} />
      </div>
      <div className="member-info">
        <span className="member-name">{name} {isYou && '(you)'}</span>
        {member.role === 'admin' && <span className="badge badge-accent" style={{ fontSize: 9, padding: '1px 6px' }}>admin</span>}
      </div>
      <div className={`member-status ${isActive ? 'online' : 'offline'}`}>
        {isActive ? 'Online' : 'Offline'}
      </div>
    </div>
  );
}
