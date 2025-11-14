// ========================================
// frontend/src/components/Auth/Register.js
// UPDATED with matching Login.js design
// ========================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Registration successful! Please complete onboarding.');
      navigate('/onboarding');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
            <h2>Start Your Journey</h2>
            <p>
              Create your account and unlock the power of AI-driven Facebook campaigns. 
              Join thousands of marketers who trust our platform for their advertising needs.
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Quick Setup Process</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span>AI-Powered Campaigns</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <span>Advanced Analytics</span>
            </div>
          </div>

          <div className="bottom-text">
            Your success story begins here
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Sign up to start creating amazing Facebook ad campaigns with AI assistance.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 6 characters)"
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
                  placeholder="Confirm your password"
                  required
                  minLength="6"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="form-footer">
              <div className="footer-links">
                <span>Already have an account? <Link to="/login">Login</Link></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;