import React, { createContext, useState, useEffect } from 'react';
import storage from '../utils/storage'; // Use our custom storage wrapper
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await storage.getItem('authToken');
      const storedUser = await storage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user, token } = response.data.data;
      
      setUser(user);
      setToken(token);
      
      await storage.setItem('authToken', token);
      await storage.setItem('user', JSON.stringify(user));
      console.log(response, 'RESPOINSE')
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }; 1
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      
      await storage.setItem('authToken', token);
      await storage.setItem('user', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      await storage.removeItem('authToken');
      await storage.removeItem('user');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      await storage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Profile update failed' 
      };
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await authService.getAllUsers();
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};