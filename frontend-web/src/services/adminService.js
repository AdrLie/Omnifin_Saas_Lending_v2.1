import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Token ${token}`,
    },
  };
};

const adminService = {
  // Users API
  getUsers: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/auth/users/`,
      getAuthHeaders()
    );
    return response.data.results || response.data;
  },

  createUser: async (userData) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/users/`,
      userData,
      getAuthHeaders()
    );
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const
     response = await axios.put(
      `${API_BASE_URL}/auth/users/${userId}/`,
      userData,
      getAuthHeaders()
    );
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/auth/users/${userId}/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Plans API
  getPlans: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/plans/`,
      getAuthHeaders()
    );
    return response.data.results || response.data;
  },

  createPlan: async (planData) => {
    const response = await axios.post(
      `${API_BASE_URL}/subscriptions/plans/`,
      planData,
      getAuthHeaders()
    );
    return response.data;
  },

  updatePlan: async (planId, planData) => {
    const response = await axios.put(
      `${API_BASE_URL}/subscriptions/plans/${planId}/`,
      planData,
      getAuthHeaders()
    );
    return response.data;
  },

  deletePlan: async (planId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/subscriptions/plans/${planId}/`,
      getAuthHeaders()
    );
    return response.data;
  },
};

export default adminService;

