import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useSession, signOut } from 'next-auth/react';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      // This will be handled by the session provider
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        signOut({ callbackUrl: '/authentication/login' });
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API service class
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = createApiInstance();
  }

  // Set authorization token
  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Clear authorization token
  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Generic GET request
  async get<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  // Generic POST request
  async post<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  // Generic PUT request
  async put<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }
}

// Create singleton instance
const apiService = new ApiService();

// Custom hook to use API with session
export const useApi = () => {
  const { data: session } = useSession();

  // Update auth token when session changes
  if (session?.accessToken) {
    apiService.setAuthToken(session.accessToken);
  }

  return apiService;
};

// Export the singleton instance for backward compatibility
export const api = apiService;

export default apiService;
