// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Onboarding from './components/Pages/Onboarding';
import Profile from './components/Pages/Profile';
import Settings from './components/Pages/Settings';
import Notifications from './components/Pages/Notifications';

// Dashboard Components
import Dashboard from './components/Dashboard/Dashboard';
import CreateCampaign from './components/Dashboard/CreateCampaign';
import CampaignScheduling from './components/Dashboard/CampaignScheduling';
import AudienceTargeting from './components/Dashboard/AudienceTargeting';
import CampaignList from './components/Dashboard/CampaignList';

import './App.css';
import './styles/DarkMode.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  // Apply theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Onboarding */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            
            {/* Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-campaign" 
              element={
                <ProtectedRoute>
                  <CreateCampaign />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/campaign-scheduling" 
              element={
                <ProtectedRoute>
                  <CampaignScheduling />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/audience-targeting" 
              element={
                <ProtectedRoute>
                  <AudienceTargeting />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/campaign-list" 
              element={
                <ProtectedRoute>
                  <CampaignList />
                </ProtectedRoute>
              } 
            />
            
            {/* Other Pages */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;