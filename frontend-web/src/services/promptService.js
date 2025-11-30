import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';


const api = axios.create({
  baseURL: `${API_BASE_URL}/prompts/`,
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

export const promptService = {
  // Get all prompts
  getAllPrompts: async () => {
    try {
      const response = await api.get('');
      return response.data;
    } catch (error) {
      console.error('Error fetching prompts:', error);
      throw error;
    }
  },

  // Get prompt by ID
  getPromptById: async (id) => {
    try {
      const response = await api.get(`${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      throw error;
    }
  },

  // Create new prompt
  createPrompt: async (promptData) => {
    try {
      const response = await api.post('', promptData);
      return response.data;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  },

  // Update prompt
  updatePrompt: async (id, promptData) => {
    try {
      const response = await api.patch(`${id}/`, promptData);
      return response.data;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  },

  // Delete prompt
  deletePrompt: async (id) => {
    try {
      const response = await api.delete(`${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  },

  // Test prompt
  testPrompt: async (content) => {
    try {
      const response = await api.post('test/', {
        content: content
      });
      return response.data;
    } catch (error) {
      console.error('Error testing prompt:', error);
      throw error;
    }
  },

  // Get prompts by category
  getPromptsByCategory: async (category) => {
    try {
      const response = await api.get('', {
        params: { category }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching prompts by category:', error);
      throw error;
    }
  },

  // Clone prompt
  clonePrompt: async (id, newName) => {
    try {
      const response = await api.post(`${id}/clone/`, {
        name: newName
      });
      return response.data;
    } catch (error) {
      console.error('Error cloning prompt:', error);
      throw error;
    }
  },

  // Get prompt variables
  getPromptVariables: async (content) => {
    try {
      const response = await api.post('parse-variables/', {
        content: content
      });
      return response.data;
    } catch (error) {
      console.error('Error parsing prompt variables:', error);
      throw error;
    }
  }
};