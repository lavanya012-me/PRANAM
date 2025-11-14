// ========================================
// frontend/src/components/Dashboard/CampaignScheduling.js
// Clean Version
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/CampaignScheduling.css';

const CampaignScheduling = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [formData, setFormData] = useState({
    campaignId: '',
    postDate: '',
    postTime: '',
    timezone: 'UTC',
    frequency: 'once'
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns);
    } catch (error) {
      toast.error('Failed to load campaigns');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post(`/campaigns/${formData.campaignId}/schedule`, {
        postDate: formData.postDate,
        postTime: formData.postTime,
        timezone: formData.timezone,
        frequency: formData.frequency
      });
      toast.success('Campaign scheduled successfully!');
      navigate('/campaign-list');
    } catch (error) {
      toast.error('Failed to schedule campaign');
    }
  };

  return (
    <div className="scheduling-wrapper">
      {/* Page Title Bar */}
      <div className="scheduling-header">
        <h1>CAMPAIGN SCHEDULING</h1>
      </div>

      {/* Main Content Container */}
      <div className="scheduling-container">
        <div className="scheduling-form-section">
          <h2 className="section-heading">Schedule Your Campaign</h2>
          
          <form onSubmit={handleSubmit} className="scheduling-form">
            {/* Campaign Selection */}
            <div className="form-group">
              <label>Campaign Name</label>
              <select 
                name="campaignId" 
                value={formData.campaignId} 
                onChange={handleChange}
                required
              >
                <option value="">Select campaign</option>
                {campaigns.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.campaignName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date and Time Row */}
            <div className="form-row">
              <div className="form-group">
                <label>Post Date</label>
                <input
                  type="date"
                  name="postDate"
                  value={formData.postDate}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Post Time</label>
                <input
                  type="time"
                  name="postTime"
                  value={formData.postTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {/* Timezone and Frequency Row */}
            <div className="form-row">
              <div className="form-group">
                <label>Timezone</label>
                <select 
                  name="timezone" 
                  value={formData.timezone} 
                  onChange={handleChange}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                  <option value="IST">IST</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Frequency</label>
                <select 
                  name="frequency" 
                  value={formData.frequency} 
                  onChange={handleChange}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            
            {/* AI Recommendation Box */}
            <div className="ai-recommendation-box">
              <h4>✨ AI Recommendation</h4>
              <p>
                Based on your audience engagement patterns, we recommend posting on{' '}
                <strong>Tuesday at 2:00 PM EST</strong> for maximum reach and engagement.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Schedule Campaign
              </button>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignScheduling;