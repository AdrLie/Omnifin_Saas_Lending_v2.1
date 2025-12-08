import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Token ${token}`,
    },
  };
};

const subscriptionService = {
  // Get all subscription plans
  getPlans: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/plans/`,
      getAuthHeaders()
    );
    // Handle both paginated and non-paginated responses
    return response.data.results || response.data;
  },

  // Get current user's subscription
  getMySubscription: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/subscriptions/my_subscription/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Create a new subscription
  createSubscription: async (planId, paymentMethodId) => {
    const response = await axios.post(
      `${API_BASE_URL}/subscriptions/subscriptions/create_subscription/`,
      {
        plan_id: planId,
        payment_method_id: paymentMethodId,
      },
      getAuthHeaders()
    );
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    const response = await axios.post(
      `${API_BASE_URL}/subscriptions/subscriptions/${subscriptionId}/cancel/`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  // Get usage statistics
  getUsage: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/subscriptions/usage/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Check usage limits
  checkLimits: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/subscriptions/check_limits/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // SuperAdmin: Create subscription plan
  createPlan: async (planData) => {
    const response = await axios.post(
      `${API_BASE_URL}/subscriptions/plans/`,
      planData,
      getAuthHeaders()
    );
    return response.data;
  },

  // SuperAdmin: Update subscription plan
  updatePlan: async (planId, planData) => {
    const response = await axios.put(
      `${API_BASE_URL}/subscriptions/plans/${planId}/`,
      planData,
      getAuthHeaders()
    );
    return response.data;
  },

  // SuperAdmin: Delete subscription plan
  deletePlan: async (planId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/subscriptions/plans/${planId}/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // SuperAdmin: Get all admin users with subscription info
  getAdminUsers: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/subscriptions/admin_users/`,
      getAuthHeaders()
    );
    return response.data;
  },

  // SuperAdmin: Assign subscription to admin user
  assignSubscription: async (userId, planId) => {
    const response = await axios.post(
      `${API_BASE_URL}/subscriptions/subscriptions/assign_subscription/`,
      {
        user_id: userId,
        plan_id: planId,
      },
      getAuthHeaders()
    );
    return response.data;
  },
};

export default subscriptionService;
