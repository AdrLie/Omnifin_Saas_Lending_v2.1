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

export const documentsService = {
  // Get all documents for an application
  getDocuments: (applicationId) => {
    return api.get(`/documents/applications/${applicationId}/documents/`);
  },

  // Get a specific document
  getDocument: (documentId) => {
    return api.get(`/documents/${documentId}/`);
  },

  // Upload a document
  uploadDocument: (applicationId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('application', applicationId);

    return api.post('/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload multiple documents
  uploadMultipleDocuments: (applicationId, files) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    formData.append('application', applicationId);

    return api.post('/documents/upload-multiple/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete a document
  deleteDocument: (documentId) => {
    return api.delete(`/documents/${documentId}/`);
  },

  // Verify a document (admin only)
  verifyDocument: (documentId, status, notes = null) => {
    const data = { status };
    if (notes) data.notes = notes;
    return api.post(`/documents/${documentId}/verify/`, data);
  },

  // Get document verification history
  getVerificationHistory: (documentId) => {
    return api.get(`/documents/${documentId}/verification-history/`);
  },

  // Get documents pending verification (admin only)
  getPendingVerifications: () => {
    return api.get('/documents/pending-verification/');
  },

  // Extract document information using AI
  extractDocumentInfo: (documentId) => {
    return api.post(`/documents/${documentId}/extract-info/`);
  },

  // Download a document
  downloadDocument: (documentId) => {
    return api.get(`/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
  },

  // Get document statistics
  getDocumentStats: () => {
    return api.get('/documents/stats/');
  },
};