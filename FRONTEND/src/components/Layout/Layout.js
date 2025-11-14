// ========================================
// frontend/src/components/Layout/Layout.js
// Updated - Conditional Sidebar (Hidden on Onboarding)
// ========================================
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Layout.css';

// Import your logo - adjust the path as needed
// import logo from '../../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check if current page is onboarding
  const isOnboardingPage = location.pathname === '/onboarding';

  return (
    <div className="layout">
      {/* Conditionally render sidebar - hide on onboarding page */}
      {!isOnboardingPage && (
        <aside className="sidebar">
          {/* Logo and Title */}
          <div className="sidebar-header">
            <div className="logo-container">
              {/* Replace this SVG with your actual logo */}
              <svg width="60" height="60" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="90" fill="#4A90E2" opacity="0.1"/>
                <path d="M100 50 L120 90 L160 90 L130 115 L145 155 L100 130 L55 155 L70 115 L40 90 L80 90 Z" fill="#4A90E2"/>
                <circle cx="70" cy="70" r="8" fill="#00D9FF"/>
                <circle cx="130" cy="70" r="8" fill="#00D9FF"/>
                <circle cx="100" cy="140" r="8" fill="#00D9FF"/>
                <line x1="70" y1="70" x2="100" y2="100" stroke="#00D9FF" strokeWidth="2"/>
                <line x1="130" y1="70" x2="100" y2="100" stroke="#00D9FF" strokeWidth="2"/>
                <line x1="100" y1="100" x2="100" y2="140" stroke="#00D9FF" strokeWidth="2"/>
              </svg>
            </div>
            <div className="app-title">
              <h1>
                AI Facebook<br/>
                Campaign <span className="highlight">Assistant</span>
              </h1>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <Link 
              to="/dashboard" 
              className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>

            <Link 
              to="/create-campaign" 
              className={`nav-item ${isActive('/create-campaign') ? 'active' : ''}`}
            >
              <span className="nav-icon">✨</span>
              <span className="nav-text">Create Campaign</span>
            </Link>

            <Link 
              to="/campaign-scheduling" 
              className={`nav-item ${isActive('/campaign-scheduling') ? 'active' : ''}`}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-text">Campaign Scheduling</span>
            </Link>

            <Link 
              to="/audience-targeting" 
              className={`nav-item ${isActive('/audience-targeting') ? 'active' : ''}`}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-text">Audience Targeting</span>
            </Link>

            <Link 
              to="/campaign-list" 
              className={`nav-item ${isActive('/campaign-list') ? 'active' : ''}`}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">Campaign List</span>
            </Link>

            <Link 
              to="/notifications" 
              className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
            >
              <span className="nav-icon">🔔</span>
              <span className="nav-text">Notifications</span>
            </Link>
          </nav>

          {/* User Section at Bottom */}
          <div className="sidebar-footer">
            <div className="user-section" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.name || 'User'}</p>
                <p className="user-email">{user?.email || 'user@example.com'}</p>
              </div>
              <span className="dropdown-arrow">▼</span>
            </div>

            {showUserMenu && (
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item">
                  <span>👤</span> Profile
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <span>⚙️</span> Settings
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content - Full width on onboarding page */}
      <main className={`main-content ${isOnboardingPage ? 'full-width' : ''}`}>
        {/* Page Content */}
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;