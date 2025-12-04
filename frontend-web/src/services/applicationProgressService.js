import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/loans/`,
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

const applicationProgressService = {
  // Get progress for an application
  getProgress: async (applicationId) => {
    const response = await api.get(`applications/${applicationId}/progress/`);
    return response.data;
  },

  // Complete a step
  completeStep: async (applicationId, stepData) => {
    const response = await api.post(`applications/${applicationId}/progress/complete-step/`, stepData);
    return response.data;
  },

  // Set current step (admin only)
  setCurrentStep: async (applicationId, step) => {
    const response = await api.post(`applications/${applicationId}/progress/set-step/`, { step });
    return response.data;
  },
};

export default applicationProgressService;
