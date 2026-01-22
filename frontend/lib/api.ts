// src/lib/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      
      if (session?.accessToken) {
        config.headers = config.headers || {};
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${session.accessToken}`);
        } else {
          // Fallback for older axios versions
          (config.headers as any)['Authorization'] = `Bearer ${session.accessToken}`;
        }
      }
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error: any) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - NextAuth will handle refresh automatically
    if (error.response?.status === 401) {
      console.error('Token expired, NextAuth will handle refresh');
      
      // Force logout if refresh fails (NextAuth handles this)
      await signOut({ 
        redirect: true,
        callbackUrl: '/home?error=session_expired' 
      });
      
      return Promise.reject({
        message: 'Session expired. Please login again.',
        status: 401,
        code: 'SESSION_EXPIRED',
        originalError: error,
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        originalError: error,
      });
    }

    // Handle other HTTP errors
    const errorData = error.response.data as any;
    const errorMessage = errorData?.message || error.message || 'Request failed';
    const statusCode = error.response?.status;

    console.error(`API Error ${statusCode}:`, errorMessage);

    // Return structured error
    return Promise.reject({
      message: errorMessage,
      status: statusCode,
      code: errorData?.code || 'UNKNOWN_ERROR',
      originalError: error,
    });
  }
);

export { api };