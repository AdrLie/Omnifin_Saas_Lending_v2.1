import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';


const api = axios.create({
  baseURL: `${API_BASE_URL}/admin/`,
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

export const superAdminService = {
  // Get system configuration
  getConfiguration: async () => {
    try {
      const response = await api.get('configuration/');
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  },

  // Update system configuration
  updateConfiguration: async (config) => {
    try {
      const response = await api.patch('configuration/', config);
      return response.data;
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  },

  // Update API key
  updateApiKey: async (service, key) => {
    try {
      const response = await api.post('api-keys/', {
        service: service,
        key: key
      });
      return response.data;
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  },

  // Test API connection
  testApiConnection: async (service) => {
    try {
      const response = await api.post('test-connection/', {
        service: service
      });
      return response.data;
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw error;
    }
  },

  // Get system logs
  getSystemLogs: async (params = {}) => {
    try {
      const response = await api.get('logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  },

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await api.get('health/');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // Backup database
  backupDatabase: async () => {
    try {
      const response = await api.post('backup/');
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // Restore database
  restoreDatabase: async (backupFile) => {
    try {
      const formData = new FormData();
      formData.append('backup_file', backupFile);
      
      const response = await api.post('restore/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error restoring database:', error);
      throw error;
    }
  },

  // Get system statistics
  getSystemStats: async () => {
    try {
      const response = await api.get('stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }
};