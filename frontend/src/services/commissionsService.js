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

export const commissionsService = {
  // Get commissions for current user (TPB)
  getCommissions: (status = null) => {
    const params = {};
    if (status) params.status = status;
    return api.get('/commissions/commissions/', { params });
  },

  // Get a specific commission
  getCommission: (commissionId) => {
    return api.get(`/commissions/commissions/${commissionId}/`);
  },

  // Get commission summary for TPB
  getCommissionSummary: () => {
    return api.get('/commissions/summary/');
  },

  // Get payout history
  getPayoutHistory: () => {
    return api.get('/commissions/payouts/');
  },

  // Get a specific payout
  getPayout: (payoutId) => {
    return api.get(`/commissions/payouts/${payoutId}/`);
  },

  // Create a payout batch (admin only)
  createPayoutBatch: (commissionIds) => {
    return api.post('/commissions/payouts/create-batch/', {
      commission_ids: commissionIds
    });
  },

  // Process a payout (admin only)
  processPayout: (payoutId) => {
    return api.post(`/commissions/payouts/${payoutId}/process/`);
  },

  // Get commission rules
  getCommissionRules: () => {
    return api.get('/commissions/rules/');
  },

  // Create a commission rule (admin only)
  createCommissionRule: (ruleData) => {
    return api.post('/commissions/rules/', ruleData);
  },

  // Update a commission rule (admin only)
  updateCommissionRule: (ruleId, ruleData) => {
    return api.patch(`/commissions/rules/${ruleId}/`, ruleData);
  },

  // Delete a commission rule (admin only)
  deleteCommissionRule: (ruleId) => {
    return api.delete(`/commissions/rules/${ruleId}/`);
  },

  // Approve a commission (admin only)
  approveCommission: (commissionId) => {
    return api.post(`/commissions/commissions/${commissionId}/approve/`);
  },

  // Reject a commission (admin only)
  rejectCommission: (commissionId, reason) => {
    return api.post(`/commissions/commissions/${commissionId}/reject/`, {
      reason
    });
  },

  // Get commission analytics
  getCommissionAnalytics: (days = 30) => {
    return api.get('/commissions/analytics/', {
      params: { days }
    });
  },

  // Export commission data
  exportCommissions: (format = 'csv', dateRange = null) => {
    const params = { format };
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }
    return api.get('/commissions/export/', {
      params,
      responseType: 'blob'
    });
  },
};