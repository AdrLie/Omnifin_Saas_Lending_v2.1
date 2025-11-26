import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import storage from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const analyticsService = {
  // Get dashboard metrics
  getDashboardMetrics: (days = 30) => {
    return api.get('/analytics/dashboard/', {
      params: { days }
    });
  },

  // Get application funnel data
  getApplicationFunnel: (days = 30) => {
    return api.get('/analytics/funnel/', {
      params: { days }
    });
  },

  // Get lender performance data
  getLenderPerformance: (days = 30) => {
    return api.get('/analytics/lender-performance/', {
      params: { days }
    });
  },

  // Get user activity data
  getUserActivity: (userId, days = 30) => {
    return api.get('/analytics/user-activity/', {
      params: { user_id: userId, days }
    });
  },

  // Get security events
  getSecurityEvents: (days = 7) => {
    return api.get('/analytics/security-events/', {
      params: { days }
    });
  },

  // Track an event
  trackEvent: (eventData) => {
    return api.post('/analytics/events/', eventData);
  },

  // Get event analytics
  getEventAnalytics: (eventType = null, days = 30) => {
    const params = { days };
    if (eventType) params.event_type = eventType;
    return api.get('/analytics/events/', { params });
  },

  // Export analytics data
  exportData: (format = 'csv', dateRange = null) => {
    const params = { format };
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }
    return api.get('/analytics/export/', {
      params,
      responseType: 'blob'
    });
  },
};