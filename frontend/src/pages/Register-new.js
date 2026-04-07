import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, BookOpen, Users, Zap, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    
    setLoading(true);
    
    try {
      const response = await fetch('https://studyhub-siol.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        })
      });
      
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('studyhub_token', data.token);
        toast.success('Welcome to StudyHub! Your account has been created.');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('Connection error - please try again');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="floating-icons">
          <BookOpen className="float-icon" style={{ left: '15%', animationDelay: '0s' }} />
          <Users className="float-icon" style={{ left: '35%', animationDelay: '1s' }} />
          <Zap className="float-icon" style={{ left: '55%', animationDelay: '2s' }} />
          <Trophy className="float-icon" style={{ left: '75%', animationDelay: '3s' }} />
          <BookOpen className="float-icon" style={{ left: '85%', animationDelay: '4s' }} />
        </div>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span>📚</span>
              <span>StudyHub</span>
            </div>
            <h2>Join StudyHub</h2>
            <p>Start your collaborative learning journey today</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <User className="form-icon" />
              <input
                type="text"
                placeholder="Choose your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <Mail className="form-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <Lock className="form-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Create your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="form-group">
              <Lock className="form-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="auth-btn primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Your StudyHub Account'}
              <ArrowRight size={18} />
            </button>
          </form>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in to StudyHub</Link></p>
            <p>By creating an account, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link></p>
          </div>
        </div>
        
        <div className="auth-features">
          <h3>What You'll Get</h3>
          <div className="feature-list">
            <div className="feature-item">
              <Users size={20} />
              <span>Join study rooms with friends</span>
            </div>
            <div className="feature-item">
              <Zap size={20} />
              <span>Track study sessions & progress</span>
            </div>
            <div className="feature-item">
              <Trophy size={20} />
              <span>Earn badges & climb leaderboards</span>
            </div>
            <div className="feature-item">
              <BookOpen size={20} />
              <span>Share notes & resources</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
