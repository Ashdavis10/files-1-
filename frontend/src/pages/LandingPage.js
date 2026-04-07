import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Timer, BookOpen, Trophy, ArrowRight, Zap, Shield, BarChart3, Flame } from 'lucide-react';
import '../styles/LandingPage.css';

const features = [
  { icon: Users, label: 'Study Rooms', desc: 'Join live rooms and collaborate in real-time with Socket.io chat', color: '#7c6aff' },
  { icon: Timer, label: 'Pomodoro Timer', desc: 'Built-in focus timer with group sync so you stay in flow together', color: '#f59e0b' },
  { icon: BookOpen, label: 'Shared Notes', desc: 'Upload files, share links, and build a knowledge base together', color: '#22c55e' },
  { icon: Trophy, label: 'Leaderboards', desc: 'Track streaks, earn badges, and compete on weekly rankings', color: '#ef4444' },
  { icon: BarChart3, label: 'Analytics', desc: 'Deep dive into your study habits with visual progress reports', color: '#38bdf8' },
  { icon: Shield, label: 'Secure Auth', desc: 'JWT + bcrypt authentication keeps your account safe', color: '#a855f7' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <span className="logo-text">StudyHub</span>
        </div>
        <div className="landing-nav">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <Zap size={12} />
          Real-time collaboration · Full-stack · Open source
        </div>
        <h1 className="hero-title">
          Study smarter,<br />
          <span className="hero-gradient">together.</span>
        </h1>
        <p className="hero-subtitle">
          A full-stack virtual study platform with real-time rooms, Pomodoro timers,
          resource sharing, and productivity analytics — built with React, Node.js, and MongoDB.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start studying free
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign in
          </Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hero-stat-value">∞</span><span className="hero-stat-label">Study rooms</span></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><span className="hero-stat-value">25:00</span><span className="hero-stat-label">Focus sessions</span></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><span className="hero-stat-value"><Flame size={28} color="var(--warning)" style={{margin: '0 auto'}}/></span><span className="hero-stat-label">Streak tracking</span></div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need to focus</h2>
        <div className="features-grid">
          {features.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="feature-card">
              <div className="feature-icon" style={{ background: color + '20', color }}>
                <Icon size={22} />
              </div>
              <h3 className="feature-title">{label}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="stack-section">
        <div className="section-label">Tech Stack</div>
        <h2 className="section-title">Built with modern tools</h2>
        <div className="stack-pills">
          {['React 18', 'Node.js', 'Express', 'MongoDB', 'Mongoose', 'Socket.io', 'JWT', 'bcrypt', 'Chart.js', 'Multer'].map(t => (
            <div key={t} className="stack-pill">{t}</div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to level up your studies?</h2>
          <p className="cta-sub">Free forever · No credit card required</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create your account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Built as a full-stack demo · React + Node.js + MongoDB + Socket.io</p>
      </footer>
    </div>
  );
}
