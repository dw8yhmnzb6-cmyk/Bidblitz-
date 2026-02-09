import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

// Storage abstraction for web and native
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login...');
      const response = await authAPI.login(email, password);
      console.log('AuthContext: API response received', response.data);
      const { token: newToken, user: userData } = response.data;
      
      console.log('AuthContext: Saving to storage...');
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(userData));
      
      console.log('AuthContext: Setting state...');
      setToken(newToken);
      setUser(userData);
      
      console.log('AuthContext: Login complete!');
      return { success: true };
    } catch (error) {
      console.log('AuthContext: Login error', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login fehlgeschlagen' 
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: newToken, user: userData } = response.data;
      
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registrierung fehlgeschlagen' 
      };
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem('token');
      await storage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    storage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
