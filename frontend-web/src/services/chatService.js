import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/ai/chat/`,
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

export const chatService = {
  // Get chat history
  getChatHistory: async () => {
    try {
      const response = await api.get('history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Send message to AI
  sendMessage: async (message) => {
    try {
      const response = await api.post('message/', {
        message: message,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Upload document for analysis
  uploadDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
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

  // Clear chat history
  clearChatHistory: async () => {
    try {
      const response = await api.delete('clear/');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  // Get AI suggestions
  getSuggestions: async (query) => {
    try {
      const response = await api.get('suggestions/', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
};