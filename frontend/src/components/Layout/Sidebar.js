import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Trophy, Timer,
  User, LogOut, Sun, Moon, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: Users, label: 'Study Rooms' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  { to: '/notes', icon: BookOpen, label: 'Notes & Resources' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'SH';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">📚</span>
        <span className="sidebar-logo-text">StudyHub</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu</span>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <span className="nav-section-label">Account</span>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User size={16} />
          Profile
        </NavLink>
        <button className="nav-link" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <LogOut size={16} />
          Logout
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={() => navigate('/profile')}>
          <div className="user-avatar">
            {user?.avatar ? <img src={user.avatar} alt={user.username} /> : initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-status">
              🔥 {user?.currentStreak || 0} day streak
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
