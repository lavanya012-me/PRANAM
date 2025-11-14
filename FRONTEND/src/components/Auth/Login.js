// ========================================
// frontend/src/components/Auth/Login.js
// COMPLETE - No Facebook integration needed here
// Facebook OAuth happens in Onboarding.js
// ========================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    rememberMe: false 
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      // Check if user has completed onboarding (connected Facebook)
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        // Redirect to onboarding to connect Facebook
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
            <h2>Welcome Back!</h2>
            <p>
              Unlock the power of AI-driven Facebook campaigns. Create, manage, 
              and optimize your advertising with intelligent automation and 
              data-driven insights.
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>AI-Powered Campaign Creation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Smart Audience Targeting</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Real-time Analytics</span>
            </div>
          </div>

          <div className="bottom-text">
            Transform your advertising strategy today
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Login</h2>
              <p>Welcome! Login to get amazing discounts and offers only for you.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
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
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

            <div className="form-footer">
              <div className="footer-links">
                <span>New User? <Link to="/register">Signup</Link></span>
                <Link to="/forgot-password" className="forgot-link">Forgot your password?</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;