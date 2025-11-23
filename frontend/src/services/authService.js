import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => {
    return api.post('/auth/login/', { email, password });
  },

  register: (userData) => {
    return api.post('/auth/register/', userData);
  },

  logout: () => {
    return api.post('/auth/logout/');
  },

  getProfile: () => {
    return api.get('/auth/me/');
  },

  updateProfile: (profileData) => {
    return api.patch('/auth/profile/', profileData);
  },

  changePassword: (passwordData) => {
    return api.post('/auth/password/change/', passwordData);
  },

  requestPasswordReset: (email) => {
    return api.post('/auth/password/reset/', { email });
  },

  confirmPasswordReset: (token, newPassword) => {
    return api.post('/auth/password/reset/confirm/', {
      token,
      new_password: newPassword
    });
  },

  verifyEmail: () => {
    return api.post('/auth/verify-email/');
  },

  // TPB specific
  getTPBProfile: () => {
    return api.get('/auth/profile/tpb/');
  },

  updateTPBProfile: (profileData) => {
    return api.patch('/auth/profile/tpb/', profileData);
  },

  // Applicant specific
  getApplicantProfile: () => {
    return api.get('/auth/profile/applicant/');
  },

  updateApplicantProfile: (profileData) => {
    return api.patch('/auth/profile/applicant/', profileData);
  },
};