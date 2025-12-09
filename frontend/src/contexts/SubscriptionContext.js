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
      
      const isActive = await subscriptionService.hasActiveSubscription();
      setHasActiveSubscription(isActive);
      
      if (isActive) {
        const details = await subscriptionService.getSubscriptionDetails();
        setSubscription(details);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err.message);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
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
