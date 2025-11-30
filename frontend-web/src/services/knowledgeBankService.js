import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';


const api = axios.create({
  baseURL: `${API_BASE_URL}/knowledge/`,
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

export const knowledgeBankService = {
  // Get documents and folders
  getDocuments: async (folderId = null) => {
    try {
      const params = {};
      if (folderId) {
        params.folder = folderId;
      }
      
      const response = await api.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (file, folderId = null, category = 'general') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      if (folderId) {
        formData.append('folder', folderId);
      }
      
      const response = await api.post('upload/', formData, {
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

  // Create folder
  createFolder: async (name, parentId = null) => {
    try {
      const data = { name };
      if (parentId) {
        data.parent = parentId;
      }
      
      const response = await api.post('folders/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  // Get document by ID
  getDocument: async (id) => {
    try {
      const response = await api.get(`documents/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  // Get document URL for viewing/downloading
  getDocumentUrl: async (id) => {
    try {
      const response = await api.get(`documents/${id}/url/`);
      return response.data.url;
    } catch (error) {
      console.error('Error fetching document URL:', error);
      throw error;
    }
  },

  // Update document
  updateDocument: async (id, data) => {
    try {
      const response = await api.patch(`documents/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`documents/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Delete folder
  deleteFolder: async (id) => {
    try {
      const response = await api.delete(`folders/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  // Search documents
  searchDocuments: async (query, category = null) => {
    try {
      const params = { q: query };
      if (category) {
        params.category = category;
      }
      
      const response = await api.get('search/', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  },

  // Get document statistics
  getStats: async () => {
    try {
      const response = await api.get('stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  },

  // Analyze document with AI
  analyzeDocument: async (documentId) => {
    try {
      const response = await api.post(`documents/${documentId}/analyze/`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  },

  // Get document categories
  getCategories: async () => {
    try {
      const response = await api.get('categories/');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
};