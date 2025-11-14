// frontend/src/components/Pages/Notifications.js
// ========================================
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/notifications?type=${filter}`);
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const clearAll = async () => {
    if (window.confirm('Clear all notifications?')) {
      try {
        await api.delete('/notifications/clear-all');
        setNotifications([]);
        toast.success('All notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notifications-wrapper">
      {/* Gradient Header */}
      <div className="notifications-header">
        <h1>NOTIFICATIONS</h1>
      </div>

      {/* Main Content Container */}
      <div className="notifications-container">
        <div className="notifications-section">
          {/* Filter and Actions Bar */}
          <div className="notification-actions">
            <select 
              className="filter-select" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Notifications</option>
              <option value="campaign">Campaign</option>
              <option value="performance">Performance</option>
              <option value="system">System</option>
            </select>
            <button className="btn-clear-all" onClick={clearAll}>
              Clear All
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h3 className="empty-title">No notifications</h3>
                <p className="empty-message">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <span className="notification-title">
                        {notif.type === 'campaign' && '📢 '}
                        {notif.type === 'performance' && '📈 '}
                        {notif.type === 'system' && '⚙️ '}
                        {notif.title}
                      </span>
                      <span className="notification-time">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    {!notif.isRead && (
                      <button 
                        className="btn-mark-read"
                        onClick={() => markAsRead(notif._id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;