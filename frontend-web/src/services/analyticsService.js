import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/analytics/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const analyticsService = {
  // Get analytics data
  getAnalytics: async (timeRange = '30d') => {
    try {
      const response = await api.get('', {
        params: { time_range: timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Get application analytics
  getApplicationAnalytics: async (params = {}) => {
    try {
      const response = await api.get('applications/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching application analytics:', error);
      throw error;
    }
  },

  // Get user analytics
  getUserAnalytics: async (params = {}) => {
    try {
      const response = await api.get('users/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  // Get revenue analytics
  getRevenueAnalytics: async (params = {}) => {
    try {
      const response = await api.get('revenue/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  },

  // Get performance analytics
  getPerformanceAnalytics: async (params = {}) => {
    try {
      const response = await api.get('performance/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      throw error;
    }
  },

  // Get real-time metrics
  getRealTimeMetrics: async () => {
    try {
      const response = await api.get('real-time/');
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  },

  // Export analytics data
  exportAnalytics: async (format = 'csv', params = {}) => {
    try {
      const response = await api.get('export/', {
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  },

  // Get custom report
  getCustomReport: async (reportType, params = {}) => {
    try {
      const response = await api.get(`reports/${reportType}/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching custom report:', error);
      throw error;
    }
  }
};