// ========================================
// frontend/src/components/Dashboard/AudienceTargeting.js
// Clean Version
// ========================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/AudienceTargeting.css';

const AudienceTargeting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    minAge: '18',
    maxAge: '65',
    gender: 'all',
    location: '',
    interests: '',
    language: 'en'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/audience', formData);
      toast.success('Audience saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save audience');
    }
  };

  return (
    <div className="targeting-wrapper">
      {/* Page Title Bar */}
      <div className="targeting-header">
        <h1>AUDIENCE TARGETING</h1>
      </div>

      {/* Main Content Container */}
      <div className="targeting-container">
        
        {/* Form Section */}
        <div className="targeting-section">
          <h2 className="section-heading">Define Your Target Audience</h2>
          
          <form onSubmit={handleSubmit} className="targeting-form">
            <div className="form-group">
              <label className="form-label">Audience Name *</label>
              <input
                className="form-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Young Professionals"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Minimum Age *</label>
                <input
                  className="form-input"
                  type="number"
                  name="minAge"
                  value={formData.minAge}
                  onChange={handleChange}
                  min="18"
                  max="65"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Maximum Age *</label>
                <input
                  className="form-input"
                  type="number"
                  name="maxAge"
                  value={formData.maxAge}
                  onChange={handleChange}
                  min="18"
                  max="65"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select 
                  className="form-select"
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Language *</label>
                <select 
                  className="form-select"
                  name="language" 
                  value={formData.language} 
                  onChange={handleChange}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., United States, California"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Interests</label>
              <input
                className="form-input"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="e.g., Technology, Fashion, Sports"
              />
            </div>
            
            <div className="ai-suggestions">
              <h4 className="suggestions-title">🎯 AI Suggestions</h4>
              <p className="suggestions-text">Based on your past campaigns:</p>
              <div className="suggestion-tags">
                <span className="tag">Ages 25-45</span>
                <span className="tag">Tech Enthusiasts</span>
                <span className="tag">Urban Areas</span>
              </div>
            </div>
            
            <button type="submit" className="primary-button">
              Save Audience
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AudienceTargeting;