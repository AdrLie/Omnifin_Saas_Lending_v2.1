import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

const profileService = {
  getCurrentUser: async () => {
    const response = await api.get('/me/');
    return response.data;
  },

  getApplicantProfile: async () => {
    const response = await api.get('/profile/applicant/');
    return response.data;
  },

  updateApplicantProfile: async (profileData) => {
    const response = await api.put('/profile/applicant/', profileData);
    return response.data;
  },

  enableMfa: async () => {
    const response = await api.post('/mfa/enable/', {});
    return response.data;
  },

  verifyMfaSetup: async (token) => {
    const response = await api.post('/mfa/verify-setup/', { token });
    return response.data;
  },

  disableMfa: async (password, token) => {
    const response = await api.post('/mfa/disable/', { password, token });
    return response.data;
  },

  getInvitationCodes: async () => {
    const response = await api.get('/invitation-codes/');
    return response.data;
  },

  createInvitationCode: async (email, daysValid = 7) => {
    const response = await api.post('/invitation-codes/create/', {
      email,
      days_valid: daysValid
    });
    return response.data;
  },
};

export default profileService;
