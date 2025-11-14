// ========================================
// frontend/src/components/Auth/ResetPassword.js
// ========================================
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../../styles/Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      // Replace with your actual API endpoint
      await axios.post('/api/auth/reset-password', {
        token,
        password: formData.password
      });

      toast.success('Password reset successful! Please login with your new password.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Welcome Section */}
        <div className="login-left">
          <div className="logo-section">
            <div className="logo-container">
              <svg width="60" height="60" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="90" fill="#FFFFFF" opacity="0.2"/>
                <path d="M100 50 L120 90 L160 90 L130 115 L145 155 L100 130 L55 155 L70 115 L40 90 L80 90 Z" fill="#FFFFFF"/>
                <circle cx="70" cy="70" r="8" fill="#FFFFFF"/>
                <circle cx="130" cy="70" r="8" fill="#FFFFFF"/>
                <circle cx="100" cy="140" r="8" fill="#FFFFFF"/>
                <line x1="70" y1="70" x2="100" y2="100" stroke="#FFFFFF" strokeWidth="2"/>
                <line x1="130" y1="70" x2="100" y2="100" stroke="#FFFFFF" strokeWidth="2"/>
                <line x1="100" y1="100" x2="100" y2="140" stroke="#FFFFFF" strokeWidth="2"/>
              </svg>
            </div>
            <div className="app-title">
              <h1>
                AI Facebook<br/>
                Campaign <span className="highlight">Assistant</span>
              </h1>
            </div>
          </div>
          
          <div className="welcome-content">
            <h2>Create New Password</h2>
            <p>
              Your new password must be different from previously used passwords.
              Choose a strong password to keep your account secure.
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Minimum 6 characters</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Use letters and numbers</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Secure encryption</span>
            </div>
          </div>

          <div className="bottom-text">
            Keep your account safe and secure
          </div>
        </div>

        {/* Right Side - Reset Password Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Reset Password</h2>
              <p>Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </form>

            <div className="form-footer">
              <div className="footer-links">
                <span>Remember your password? <Link to="/login">Back to Login</Link></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;