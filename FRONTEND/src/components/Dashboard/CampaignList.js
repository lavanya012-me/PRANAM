// ========================================
// frontend/src/components/Dashboard/CampaignList.js
// Updated - With Facebook Campaign Management
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/CampaignList.css';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/campaigns?status=${filter}&search=${search}`);
      setCampaigns(response.data.campaigns);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await api.delete(`/campaigns/${id}`);
        toast.success('Campaign deleted');
        fetchCampaigns();
      } catch (error) {
        toast.error('Failed to delete campaign');
      }
    }
  };

  const publishToFacebook = async (campaignId) => {
    if (window.confirm('Publish this campaign to Facebook Ads Manager?')) {
      setLoading(true);
      try {
        const response = await api.post(`/campaigns/${campaignId}/publish-facebook`);
        
        if (response.data.success) {
          toast.success('Campaign published to Facebook!');
          if (response.data.adsManagerUrl) {
            window.open(response.data.adsManagerUrl, '_blank');
          }
          fetchCampaigns();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to publish to Facebook');
      } finally {
        setLoading(false);
      }
    }
  };

  const syncFacebookData = async (campaignId) => {
    setLoading(true);
    try {
      const response = await api.get(`/campaigns/${campaignId}/facebook-insights`);
      
      if (response.data.success) {
        toast.success('Facebook data synced successfully!');
        fetchCampaigns();
      }
    } catch (error) {
      toast.error('Failed to sync Facebook data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campaign-list-wrapper">
      {/* Page Title Bar */}
      <div className="campaign-list-header">
        <h1>CAMPAIGN LIST</h1>
      </div>

      {/* Main Content Container */}
      <div className="campaign-list-container">
        
        {/* List Section */}
        <div className="campaign-list-section">
          {/* Header with Title and Button */}
          <div className="list-header">
            <h2 className="section-heading">All Campaigns</h2>
            <button className="primary-button" onClick={() => navigate('/create-campaign')}>
              ✨ New Campaign
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <input
              className="search-input"
              placeholder="🔍 Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select 
              className="filter-select" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Campaign Cards or Empty State */}
          {loading ? (
            <div className="loading-state">
              <p>⏳ Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">No campaigns found</h3>
              <p className="empty-message">Create your first campaign to get started</p>
              <button className="primary-button" onClick={() => navigate('/create-campaign')}>
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="campaign-card">
                  <div className="campaign-card-header">
                    <h3 className="campaign-title">{campaign.campaignName}</h3>
                    <span className={`status-badge status-${campaign.status}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <p className="campaign-desc">{campaign.description}</p>
                  
                  <div className="campaign-meta">
                    <span className="meta-item">📊 {campaign.objective}</span>
                    <span className="meta-item">💰 ${campaign.budget}</span>
                    <span className="meta-item">⏱️ {campaign.duration} days</span>
                  </div>
                  
                  {/* Facebook Campaign Indicator */}
                  {campaign.facebookCampaignId && (
                    <div className="fb-campaign-badge">
                      <svg className="fb-icon-small" fill="#1877f2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Published on Facebook</span>
                    </div>
                  )}
                  
                  {campaign.status === 'published' && (
                    <div className="campaign-stats">
                      <span className="stat-item">👁️ {campaign.analytics?.impressions?.toLocaleString() || 0}</span>
                      <span className="stat-item">👆 {campaign.analytics?.clicks?.toLocaleString() || 0}</span>
                      <span className="stat-item">❤️ {campaign.analytics?.likes || 0}</span>
                    </div>
                  )}
                  
                  <div className="campaign-actions">
                    <button className="btn-secondary" onClick={() => navigate(`/edit-campaign/${campaign._id}`)}>
                      Edit
                    </button>
                    
                    {!campaign.facebookCampaignId && campaign.status === 'draft' && (
                      <button 
                        className="btn-primary" 
                        onClick={() => publishToFacebook(campaign._id)}
                        disabled={loading}
                      >
                        📱 Publish to FB
                      </button>
                    )}
                    
                    {campaign.facebookCampaignId && (
                      <button 
                        className="btn-info" 
                        onClick={() => syncFacebookData(campaign._id)}
                        disabled={loading}
                      >
                        🔄 Sync FB Data
                      </button>
                    )}
                    
                    <button 
                      className="btn-danger" 
                      onClick={() => deleteCampaign(campaign._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignList;