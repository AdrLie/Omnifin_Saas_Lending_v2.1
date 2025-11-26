// services/authService.js
import axios from 'axios';
import storage from '../utils/storage';

const API_URL = 'http://localhost:8000/'; // Your Django API URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',  // ← Add this
  }

});

// Function to get CSRF token from cookies
const getCsrfToken = () => {
  if (typeof document !== 'undefined') {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  return null;
};

// Add CSRF token to all requests
api.interceptors.request.use(
  async (config) => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    // Add auth token if available
    const token = await storage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    // First, get CSRF token by making a GET request
    await api.get('/api/csrf/'); // You need to create this endpoint
    
    // Then make the login request
    const response = await api.post('/api/auth/login/', {
      email,
      password,
    });
    return response;
  },

  register: async (userData) => {
    await api.get('/api/csrf/');
    const response = await api.post('/api/auth/register/', userData);
    return response;
  },

  logout: async () => {
    const response = await api.post('/api/logout/');
    return response;
  },

  updateProfile: async (profileData) => {
      // Axios interceptor already adds the Authorization header
      const response = await api.put('/api/auth/profile/', profileData);
      return response;
    },
  
  getAllUsers: async () => {
      const response = await api.get('/api/auth/users/');
      return response;
    }
};