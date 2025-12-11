import React, { createContext, useState, useEffect, useCallback } from 'react';
import subscriptionService from '../services/subscriptionService';

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setHasActiveSubscription(false);
        setSubscription(null);
        return;
      }

      // Use subscriptionService for consistent API calls
      const subData = await subscriptionService.getMySubscription();
      setSubscription(subData);
      setHasActiveSubscription(true);
    } catch (err) {
      // If no subscription found (404), don't show error
      if (err.response?.status === 404) {
        setHasActiveSubscription(false);
        setSubscription(null);
      } else {
        console.error('Error checking subscription:', err);
        setError(err.message);
        setHasActiveSubscription(false);
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    // Check subscription every 30 seconds to stay in sync
    const interval = setInterval(checkSubscription, 30000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const value = {
    subscription,
    hasActiveSubscription,
    loading,
    error,
    checkSubscription,
    setHasActiveSubscription,
    setSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
