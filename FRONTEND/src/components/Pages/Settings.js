// frontend/src/components/Pages/Settings.js
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/Settings.css';
import '../../styles/DarkMode.css';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'en',
    emailNotif: localStorage.getItem('emailNotif') === 'true',
    pushNotif: localStorage.getItem('pushNotif') === 'true',
    campaignUpdates: localStorage.getItem('campaignUpdates') === 'true'
  });

  // Apply theme on component mount
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings.theme]);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage immediately for theme changes
    if (key === 'theme') {
      localStorage.setItem('theme', value);
      if (value === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      toast.success(`Theme changed to ${value === 'dark' ? 'Dark' : 'Light'} mode`);
    }
  };

  const handleSave = async () => {
    try {
      // Save all settings to localStorage
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('language', settings.language);
      localStorage.setItem('emailNotif', settings.emailNotif);
      localStorage.setItem('pushNotif', settings.pushNotif);
      localStorage.setItem('campaignUpdates', settings.campaignUpdates);
      
      // Also save to backend
      await api.put('/user/preferences', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Settings save error:', error);
      // Even if backend fails, settings are saved locally
      toast.success('Settings saved locally');
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Facebook?')) {
      try {
        await api.post('/facebook/disconnect');
        toast.success('Facebook disconnected');
      } catch (error) {
        toast.error('Failed to disconnect');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('⚠️ Are you sure? This action cannot be undone.')) {
      try {
        await api.delete('/user/account');
        toast.success('Account deleted');
        navigate('/login');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <div className="settings-wrapper">
      {/* Gradient Header */}
      <div className="settings-header">
        <h1>SETTINGS</h1>
      </div>

      {/* Main Content Container */}
      <div className="settings-container">
        <div className="settings-content">
          
          {/* Appearance Section */}
          <section className="settings-section">
            <h3 className="section-title">🎨 Appearance</h3>
            <div className="settings-card">
              <div className="form-group">
                <label>Theme</label>
                <select 
                  className="settings-select"
                  value={settings.theme} 
                  onChange={(e) => handleChange('theme', e.target.value)}
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Language</label>
                <select 
                  className="settings-select"
                  value={settings.language} 
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* Notifications Section */}
          <section className="settings-section">
            <h3 className="section-title">🔔 Notifications</h3>
            <div className="settings-card">
              <div className="toggle-option">
                <label>📧 Email Notifications</label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotif} 
                    onChange={(e) => handleChange('emailNotif', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-option">
                <label>📱 Push Notifications</label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.pushNotif} 
                    onChange={(e) => handleChange('pushNotif', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-option">
                <label>📊 Campaign Updates</label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.campaignUpdates} 
                    onChange={(e) => handleChange('campaignUpdates', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
          
          {/* Facebook Connection Section */}
          <section className="settings-section">
            <h3 className="section-title">📱 Facebook Connection</h3>
            <div className="settings-card connection-card">
              <div className="connection-info">
                <p className="connection-status"><strong>✅ Status: Connected</strong></p>
                <p className="connection-detail">Connected to: My Business Page</p>
              </div>
              <button className="btn-disconnect" onClick={handleDisconnect}>
                Disconnect Facebook
              </button>
            </div>
          </section>
          
          {/* Security Section */}
          <section className="settings-section">
            <h3 className="section-title">🔒 Security</h3>
            <div className="settings-card">
              <button className="btn-secondary" onClick={() => toast.info('Password change feature coming soon')}>
                Change Password
              </button>
            </div>
          </section>
          
          {/* Danger Zone Section */}
          <section className="settings-section danger-zone">
            <h3 className="section-title">⚠️ Danger Zone</h3>
            <div className="settings-card danger-card">
              <div className="danger-info">
                <p className="danger-title"><strong>Delete Account</strong></p>
                <p className="danger-description">Once you delete your account, there is no going back.</p>
              </div>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </section>
          
          {/* Save Button */}
          <button className="btn-save-settings" onClick={handleSave}>
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;