import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const API_URL = `${API_BASE_URL}/subscriptions`;

const subscriptionService = {
  // Get user's subscription status
  getSubscriptionStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/status/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all available plans
  getPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/plans/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user has active subscription
  hasActiveSubscription: async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      return response?.status === 'active' || response?.status === 'trialing';
    } catch (error) {
      return false;
    }
  },

  // Get subscription details
  getSubscriptionDetails: async () => {
    try {
      const response = await axios.get(`${API_URL}/current/`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Initiate checkout
  initiateCheckout: async (planId) => {
    try {
      const response = await axios.post(`${API_URL}/checkout/`, { plan_id: planId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async () => {
    try {
      const response = await axios.post(`${API_URL}/cancel/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default subscriptionService;
