import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BookOpen, Users, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    
    try {
      const response = await fetch('https://studyhub-siol.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('studyhub_token', data.token);
        toast.success('Welcome back to StudyHub!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
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
          <BookOpen className="float-icon" style={{ left: '10%', animationDelay: '0s' }} />
          <Users className="float-icon" style={{ left: '30%', animationDelay: '1s' }} />
          <Zap className="float-icon" style={{ left: '50%', animationDelay: '2s' }} />
          <BookOpen className="float-icon" style={{ left: '70%', animationDelay: '3s' }} />
          <Users className="float-icon" style={{ left: '90%', animationDelay: '4s' }} />
        </div>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span>📚</span>
              <span>StudyHub</span>
            </div>
            <h2>Welcome Back</h2>
            <p>Continue your learning journey with StudyHub</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your password"
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
            
            <button type="submit" className="auth-btn primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to StudyHub'}
              <ArrowRight size={18} />
            </button>
          </form>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <div className="auth-footer">
            <p>New to StudyHub? <Link to="/register">Create your account</Link></p>
            <p><Link to="/forgot-password">Forgot your password?</Link></p>
          </div>
        </div>
        
        <div className="auth-features">
          <h3>Why StudyHub?</h3>
          <div className="feature-list">
            <div className="feature-item">
              <Users size={20} />
              <span>Study with friends in real-time</span>
            </div>
            <div className="feature-item">
              <Zap size={20} />
              <span>Track your progress with analytics</span>
            </div>
            <div className="feature-item">
              <BookOpen size={20} />
              <span>Access shared notes and resources</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
