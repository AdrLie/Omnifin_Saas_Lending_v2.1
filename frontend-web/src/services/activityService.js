import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/auth/`,
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

const activityService = {
  // Get user activities
  getActivities: async (params = {}) => {
    console.log('Fetching activities with params:', params);
    const response = await api.get('activities/', { params });
    console.log('Activities API response:', response.data);
    return response.data;
  },

  // Get activities for specific user (admin only)
  getUserActivities: async (userId, params = {}) => {
    const response = await api.get('activities/', { params: { ...params, user_id: userId } });
    return response.data;
  },

  // Log a custom activity
  logActivity: async (activityData) => {
    const response = await api.post('activities/', activityData);
    return response.data;
  },
};

export default activityService;
