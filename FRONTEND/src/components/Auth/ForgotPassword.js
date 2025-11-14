// ========================================
// frontend/src/components/Auth/ForgotPassword.js
// ========================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Replace with your actual API endpoint
      await axios.post('/api/auth/forgot-password', { email });
      
      toast.success('Password reset link sent to your email!');
      setEmailSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
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
            <h2>Reset Your Password</h2>
            <p>
              Don't worry! It happens. Enter your email address and we'll send 
              you a link to reset your password.
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure Password Recovery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✉️</span>
              <span>Email Verification</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Quick & Easy Process</span>
            </div>
          </div>

          <div className="bottom-text">
            Your security is our priority
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Forgot Password?</h2>
              <p>
                {emailSent 
                  ? "Check your email for a password reset link."
                  : "Enter your email address and we'll send you a reset link."
                }
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                  />
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>
            ) : (
              <div className="success-message" style={{ 
                padding: '20px', 
                background: '#f0fdf4', 
                border: '1px solid #86efac', 
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <p style={{ margin: 0, color: '#166534', fontSize: '14px' }}>
                  ✓ We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
              </div>
            )}

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

export default ForgotPassword;