// ========================================
// frontend/src/components/Dashboard/CreateCampaign.js
// Fixed - Button Layout Corrected
// ========================================
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/Campaign.css';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    campaignName: '',
    pageName: '',
    pageId: 'demo-page-id',
    objective: 'awareness',
    description: '',
    adType: 'single_image',
    budget: '',
    duration: ''
  });
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or video.');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 50MB.');
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview({
        url: reader.result,
        type: file.type.startsWith('image') ? 'image' : 'video',
        name: file.name
      });
    };
    reader.readAsDataURL(file);

    toast.success('Media file selected!');
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected media
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Media removed');
  };

  const generateAI = async () => {
    if (!formData.description) {
      toast.error('Please enter a description first');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/campaigns/generate-content', {
        description: formData.description,
        objective: formData.objective,
        adType: formData.adType
      });
      setGeneratedContent(response.data.content);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mediaFile) {
      toast.error('Please upload media for your campaign');
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData for file upload
      const campaignData = new FormData();
      campaignData.append('campaignName', formData.campaignName);
      campaignData.append('pageName', formData.pageName);
      campaignData.append('pageId', formData.pageId);
      campaignData.append('objective', formData.objective);
      campaignData.append('description', formData.description);
      campaignData.append('adType', formData.adType);
      campaignData.append('budget', formData.budget);
      campaignData.append('duration', formData.duration);
      
      if (generatedContent) {
        campaignData.append('generatedContent', JSON.stringify(generatedContent));
      }
      
      // Append media file
      campaignData.append('media', mediaFile);

      await api.post('/campaigns', campaignData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Campaign created successfully!');
      navigate('/campaign-list');
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campaign-wrapper">
      {/* Page Title Bar - Gradient Header (No extra button) */}
      <div className="campaign-header">
        <h1>CREATE CAMPAIGN</h1>
      </div>

      {/* Main Content Container */}
      <div className="campaign-container">
        <div className="campaign-form-section">
          <h2 className="section-heading">Campaign Details</h2>
          
          <form onSubmit={handleSubmit} className="campaign-form">
            <div className="form-row">
              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  name="campaignName"
                  value={formData.campaignName}
                  onChange={handleChange}
                  placeholder="e.g., Summer Sale 2025"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Page Name</label>
                <input
                  name="pageName"
                  value={formData.pageName}
                  onChange={handleChange}
                  placeholder="e.g., My Business Page"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Objective</label>
                <select name="objective" value={formData.objective} onChange={handleChange}>
                  <option value="awareness">Awareness</option>
                  <option value="engagement">Engagement</option>
                  <option value="traffic">Traffic</option>
                  <option value="leads">Leads</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Ad Type</label>
                <select name="adType" value={formData.adType} onChange={handleChange}>
                  <option value="single_image">Single Image</option>
                  <option value="video">Video</option>
                  <option value="carousel">Carousel</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe your campaign... (e.g., Promote our new summer collection with exclusive discounts)"
                required
              />
            </div>
            
            <button 
              type="button" 
              className="ai-generate-button"
              onClick={generateAI}
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : '✨ Generate with AI'}
            </button>
            
            {generatedContent && (
              <div className="generated-content-box">
                <h4>🎯 AI Generated Content</h4>
                <div className="content-preview">
                  <p><strong>Post Copy:</strong></p>
                  <p>{generatedContent.postCopy}</p>
                  <p><strong>Captions:</strong></p>
                  <p>{generatedContent.captions?.join(' • ')}</p>
                  <p><strong>Hashtags:</strong></p>
                  <p className="hashtags">{generatedContent.hashtags?.join(' ')}</p>
                </div>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Budget ($)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                  min="1"
                  required
                />
              </div>
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            
            {/* Media Upload Section */}
            {!mediaPreview ? (
              <div className="file-upload-area" onClick={handleUploadClick}>
                <div className="upload-icon">📸</div>
                <p className="upload-text">Click to upload media</p>
                <p className="upload-hint">Supports images and videos (max 50MB)</p>
              </div>
            ) : (
              <div className="media-preview-box">
                <div className="preview-header">
                  <h4>📎 Uploaded Media</h4>
                  <button 
                    type="button" 
                    className="remove-media-btn"
                    onClick={handleRemoveMedia}
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="preview-content">
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="Preview" />
                  ) : (
                    <video src={mediaPreview.url} controls />
                  )}
                  <p className="file-name">{mediaPreview.name}</p>
                </div>
              </div>
            )}
            
            {/* Form Actions - Create Campaign (large) + Cancel (small) */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-button"
                disabled={loading}
              >
                {loading ? '⏳ Creating Campaign...' : 'Create Campaign'}
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

export default CreateCampaign;