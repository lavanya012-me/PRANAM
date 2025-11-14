// ========================================
// frontend/src/components/Pages/Profile.js
// ========================================
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/Profile.css';
import '../../styles/DarkMode.css';
const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      setFormData(response.data.user);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/profile', formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      {/* Gradient Header */}
      <div className="profile-header">
        <h1>PROFILE SETTINGS</h1>
      </div>

      {/* Main Content Container */}
      <div className="profile-container">
        <div className="profile-section">
          {/* Profile Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-circle">👤</div>
            <button className="btn-change-photo">Change Photo</button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Account Details Section */}
            <div className="account-section">
              <h3 className="section-title">📱 Account Details</h3>
              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">Connected Facebook:</span>
                  <span className="info-value">facebook.com/mybusinesspage</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Selected Page:</span>
                  <span className="info-value">My Business Page</span>
                </div>
              </div>
            </div>

            {/* Billing Section */}
            <div className="billing-section">
              <h3 className="section-title">💳 Billing Information</h3>
              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">Payment Method:</span>
                  <span className="info-value">Visa •••• 4242</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Invoice:</span>
                  <span className="info-value">$150.00 - Oct 28, 2025</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;