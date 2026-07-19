import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const verifyEmail = async (email, code) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Verification failed';
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data || { message: 'Login failed' };
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Password reset request failed';
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, code, newPassword });
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Password reset execution failed';
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on backend:', error.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  };

  const updateUserProfile = async (username, profilePicture) => {
    try {
      const response = await api.put('/profile', { username, profilePicture });
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Profile update failed';
    }
  };

  const deleteUserAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/profile');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Account deletion failed';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        verifyEmail,
        login,
        forgotPassword,
        resetPassword,
        logout,
        updateUserProfile,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
