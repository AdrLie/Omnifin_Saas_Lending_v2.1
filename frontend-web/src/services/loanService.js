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

export const loanService = {
  // Get all loans
  getAllLoans: async (params = {}) => {
    try {
      const response = await api.get('/applications/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  },

  // Get loan by ID
  getLoanById: async (id) => {
    try {
      const response = await api.get(`applications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan:', error);
      throw error;
    }
  },

  // Create new loan application
  createLoan: async (loanData) => {
    try {
      const response = await api.post('applications/apply/', loanData);
      return response.data;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  },

  // Update loan
  updateLoan: async (id, loanData) => {
    try {
      const response = await api.patch(`applications/${id}/`, loanData);
      return response.data;
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  },

  // Update loan status
  updateLoanStatus: async (id, status) => {
    try {
      const response = await api.post(`applications/${id}/update_status/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating loan status:', error);
      throw error;
    }
  },

  // Delete loan
  deleteLoan: async (id) => {
    try {
      const response = await api.delete(`applications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  },

  // Add review note
  addReviewNote: async (id, note) => {
    try {
      const response = await api.post(`applications/${id}/notes/`, {
        note: note
      });
      return response.data;
    } catch (error) {
      console.error('Error adding review note:', error);
      throw error;
    }
  },

  // Upload loan document
  uploadDocument: async (loanId, file, documentType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('loan', loanId);

      const response = await api.post('applications/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get loan documents
  getLoanDocuments: async (loanId) => {
    try {
      const response = await api.get(`applications/${loanId}/documents/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan documents:', error);
      throw error;
    }
  },

  // Get loan statistics
  getLoanStats: async (params = {}) => {
    try {
      const response = await api.get('stats/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching loan stats:', error);
      throw error;
    }
  },

  // Export loan data
  exportLoans: async (format = 'csv', params = {}) => {
    try {
      const response = await api.get('export/', {
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting loans:', error);
      throw error;
    }
  },

  // Get loan by application number
  getLoanByApplicationNumber: async (applicationNumber) => {
    try {
      const response = await api.get('', {
        params: { application_number: applicationNumber }
      });
      return response.data.results?.[0] || null;
    } catch (error) {
      console.error('Error fetching loan by application number:', error);
      throw error;
    }
  }
};