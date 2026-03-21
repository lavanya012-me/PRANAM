// ========================================
// frontend/src/components/Pages/Onboarding.js
// COMPLETE FIX - Updated with correct Facebook permissions
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedPage, setSelectedPage] = useState('');
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle OAuth callback on component mount
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        toast.error('Facebook authentication was cancelled');
        setStep(1);
        return;
      }

      if (code) {
        await handleOAuthCallback(code, state);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency to run only once

  // Handle Facebook OAuth Callback
  const handleOAuthCallback = async (code, state) => {
    try {
      setLoading(true);
      setError(null);

      // Verify state (CSRF protection)
      const savedState = sessionStorage.getItem('fb_oauth_state');
      if (savedState && state !== savedState) {
        throw new Error('Invalid state parameter');
      }

      console.log('Processing OAuth callback with code:', code);

      // Send code to backend
      const response = await api.post('/auth/facebook/callback', {
        code,
        state,
        redirect_uri: `${window.location.origin}/onboarding`
      });

      console.log('Backend response:', response.data);

      if (response.data && response.data.success) {
        // Store access token
        if (response.data.accessToken) {
          localStorage.setItem('facebook_access_token', response.data.accessToken);
        }

        // Store JWT token for API requests
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }

        // Store user data if provided
        if (response.data.user) {
          localStorage.setItem('facebook_user', JSON.stringify(response.data.user));
        }

        // Fetch user's Facebook pages
        if (response.data.pages && response.data.pages.length > 0) {
          setPages(response.data.pages);
          setStep(2);
          toast.success('Successfully connected to Facebook!');
        } else {
          // No pages found
          toast.warning('No Facebook pages found. Please create a page first.');
          setStep(2);
        }

        // Clear OAuth state
        sessionStorage.removeItem('fb_oauth_state');

        // Remove query parameters from URL
        window.history.replaceState({}, document.title, '/onboarding');
      } else {
        throw new Error(response.data?.message || 'Failed to authenticate with Facebook');
      }

    } catch (err) {
      console.error('OAuth callback error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
      setStep(1);
      
      // Clear URL parameters on error
      window.history.replaceState({}, document.title, '/onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Connect Facebook Handler - UPDATED WITH CORRECT PERMISSIONS
  const connectFacebook = () => {
    try {
      const fbAppId = process.env.REACT_APP_FACEBOOK_APP_ID || '1961395587736473';
      const redirectUri = encodeURIComponent(`${window.location.origin}/onboarding`);
      
      // FIXED: Use only the permissions available in your app
      const scope = encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,read_insights');
      const state = Math.random().toString(36).substring(7);
      
      const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
      
      // Store state for verification
      sessionStorage.setItem('fb_oauth_state', state);
      
      console.log('Redirecting to Facebook OAuth:', fbAuthUrl);
      
      // Redirect to Facebook
      window.location.href = fbAuthUrl;
    } catch (err) {
      console.error('Error initiating Facebook login:', err);
      toast.error('Failed to initiate Facebook login');
    }
  };

  // Select Page Handler
  const selectPage = async () => {
    if (!selectedPage) {
      toast.error('Please select a page');
      return;
    }

    try {
      setLoading(true);
      const page = pages.find(p => p.id === selectedPage);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      await api.post('/facebook/pages/select', {
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Page selected successfully!');
      
      // Mark user as onboarded
      await api.post('/auth/complete-onboarding', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Error selecting page:', error);
      toast.error(error.response?.data?.message || 'Failed to select page');
    } finally {
      setLoading(false);
    }
  };

  // Skip page selection (if user has no pages)
  const skipPageSelection = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Mark user as onboarded even without page
      await api.post('/auth/complete-onboarding', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.info('You can connect a Facebook page later from settings');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading && !error && !step) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <h2>Connecting to Facebook...</h2>
            <p>Please wait while we set up your account</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>Welcome! 🎉</h1>
        <p>Let's set up your Facebook campaign assistant</p>
        
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {step === 1 && (
          <div className="onboarding-steps">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Connect Facebook Account</h3>
              <p>Connect your Facebook account to manage your pages and campaigns</p>
              <button 
                className="btn-primary" 
                onClick={connectFacebook}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {loading ? 'Connecting...' : 'Connect Facebook'}
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="onboarding-steps">
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Select Facebook Page</h3>
              <p>Choose the Facebook page you want to manage campaigns for</p>
              
              {pages.length > 0 ? (
                <>
                  <select 
                    className="form-select"
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                  >
                    <option value="">Select a page...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name} {page.category ? `(${page.category})` : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn-primary" 
                    onClick={selectPage}
                    disabled={!selectedPage || loading}
                  >
                    {loading ? 'Setting up...' : 'Continue to Dashboard'}
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={skipPageSelection}
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                  >
                    Skip for now
                  </button>
                </>
              ) : (
                <div>
                  <p className="no-pages-message">
                    No Facebook pages found. You can create a Facebook page first or skip this step.
                  </p>
                  <button 
                    className="btn-primary" 
                    onClick={skipPageSelection}
                    disabled={loading}
                  >
                    Continue to Dashboard
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setStep(1)}
                    style={{ marginTop: '10px' }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;