import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/LoginPage.css'; // Reuse auth styles

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      // In this demo, we bypass email checking by catching the token from the response:
      toast.success('Simulation: Redirecting to your reset link...', { duration: 4000 });
      setTimeout(() => {
        navigate(`/reset-password/${data.resetToken}`);
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <Link to="/login" className="auth-back">← Back to login</Link>
        <div className="auth-logo">📚</div>
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to receive a password reset link.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input padded-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Sending...' : (<>Send Reset Link <ArrowRight size={16} /></>)}
          </button>
        </form>
      </div>
    </div>
  );
}
