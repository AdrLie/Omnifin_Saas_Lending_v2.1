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

export const applicationsService = {
  // Get all applications for current user
  getApplications: () => {
    return api.get('/loans/applications/');
  },

  // Get a specific application
  getApplication: (applicationId) => {
    return api.get(`/loans/applications/${applicationId}/`);
  },

  // Create a new application
  createApplication: (applicationData) => {
    return api.post('/loans/applications/', applicationData);
  },

  // Update an application
  updateApplication: (applicationId, applicationData) => {
    return api.patch(`/loans/applications/${applicationId}/`, applicationData);
  },

  // Delete an application
  deleteApplication: (applicationId) => {
    return api.delete(`/loans/applications/${applicationId}/`);
  },

  // Submit an application to lenders
  submitApplication: (applicationId) => {
    return api.post(`/loans/applications/${applicationId}/submit/`);
  },

  // Update application status
  updateApplicationStatus: (applicationId, status, notes = null) => {
    const data = { status };
    if (notes) data.notes = notes;
    return api.post(`/loans/applications/${applicationId}/update_status/`, data);
  },

  // Get application status history
  getApplicationStatusHistory: (applicationId) => {
    return api.get(`/loans/applications/${applicationId}/status_history/`);
  },

  // Get offers for an application
  getApplicationOffers: (applicationId) => {
    return api.get(`/loans/applications/${applicationId}/offers/`);
  },

  // Get dashboard data
  getDashboardData: () => {
    return api.get('/loans/dashboard/');
  },

  // Get lender performance
  getLenderPerformance: () => {
    return api.get('/loans/lender-performance/');
  },
};