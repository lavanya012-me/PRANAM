// ========================================
// frontend/src/components/Dashboard/Dashboard.js
// Clean Version - No Changes Required
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    impressions: 0,
    clicks: 0,
    engagement: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      const camps = response.data.campaigns;
      setCampaigns(camps);
      
      const stats = camps.reduce((acc, camp) => ({
        total: acc.total + 1,
        impressions: acc.impressions + (camp.analytics?.impressions || 0),
        clicks: acc.clicks + (camp.analytics?.clicks || 0),
        engagement: acc.engagement + (camp.analytics?.engagement || 0)
      }), { total: 0, impressions: 0, clicks: 0, engagement: 0 });
      
      setAnalytics(stats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Page Title Bar */}
      <div className="dashboard-header">
        <h1>DASHBOARD</h1>
      </div>

      {/* Main Content Container */}
      <div className="dashboard-container">
        
        {/* Analytics Overview Section */}
        <div className="analytics-section">
          <h2 className="section-heading">Analytics Overview</h2>
          
          {/* Stats Cards Grid */}
          <div className="stats-cards-grid">
            <div className="metric-card">
              <p className="metric-label">TOTAL CAMPAIGNS</p>
              <h3 className="metric-value">{analytics.total}</h3>
              <p className="metric-change positive">+2 this week</p>
            </div>
            
            <div className="metric-card">
              <p className="metric-label">TOTAL REACH</p>
              <h3 className="metric-value">{analytics.impressions.toLocaleString()}</h3>
              <p className="metric-change positive">+15% vs last month</p>
            </div>
            
            <div className="metric-card">
              <p className="metric-label">ENGAGEMENT RATE</p>
              <h3 className="metric-value">{analytics.engagement}%</h3>
              <p className="metric-change positive">+0.5% improvement</p>
            </div>
          </div>

          {/* Recent Campaigns Section */}
          <div className="recent-campaigns-section">
            <h3 className="campaigns-heading">Recent Campaigns</h3>
            
            <div className="campaigns-container">
              {campaigns.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-message">No campaigns yet</p>
                  <button 
                    className="primary-button"
                    onClick={() => navigate('/create-campaign')}
                  >
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                <div className="campaigns-table">
                  {campaigns.slice(0, 5).map((camp, i) => (
                    <div key={i} className="campaign-row">
                      <div className="campaign-details">
                        <span className="campaign-title">{camp.campaignName || camp.name}</span>
                      </div>
                      <div className="campaign-status-container">
                        <span className={`status-badge status-${camp.status.toLowerCase()}`}>
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;