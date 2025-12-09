import React, { createContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';

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
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/subscriptions/status/`,
        {
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        setHasActiveSubscription(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const isActive = data.status === 'active' || data.status === 'trialing';
      setHasActiveSubscription(isActive);

      if (isActive) {
        const detailsResponse = await fetch(
          `${API_BASE_URL}/subscriptions/current/`,
          {
            headers: {
              'Authorization': `Token ${token}`,
            },
          }
        );

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          setSubscription(details);
        }
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err.message);
      setHasActiveSubscription(false);
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
