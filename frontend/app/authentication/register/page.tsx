'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  userType: 'client' | 'provider' | 'admin';
  services?: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    userType: 'client',
    services: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Predefined service options
  const serviceOptions = [
    'Consulting',
    'Legal',
    'Accounting',
    'IT Support',
    'Marketing',
    'Design',
    'Writing',
    'Translation',
    'Management',
    'Training'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...(prev.services || []), service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.userType === 'provider' && (!formData.services || formData.services.length === 0)) {
      setError('At least one service must be selected for providers');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Step 1: Create user in Keycloak
      const createUserResponse = await api.post('/keycloak/users', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        ...(formData.userType === 'provider' && { services: formData.services })
      });

      if (!createUserResponse.data) {
        throw new Error('Failed to create user');
      }

      // Step 2: Assign role to user
      const roleAssignmentResponse = await api.post('/keycloak/assign-role', {
        username: formData.username,
        roleName: formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)
      });

      if (!roleAssignmentResponse.data) {
        throw new Error('Failed to assign role');
      }

      setSuccess('User registered successfully! Redirecting to login...');
      
      // Redirect to login after successful registration
      setTimeout(() => {
        router.push('/home');
      }, 2000);

    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.response?.status === 409) {
        setError('User already exists with this email or username');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid registration data');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register for a new account
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password"
              />
            </div>

            {/* User Type Field */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Services Field - Only for Providers */}
            {formData.userType === 'provider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services (select all that apply)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {serviceOptions.map((service) => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services?.includes(service) || false}
                        onChange={() => handleServiceToggle(service)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
                {formData.userType === 'provider' && (!formData.services || formData.services.length === 0) && (
                  <p className="text-red-500 text-sm mt-1">At least one service must be selected</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-6">
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/authentication/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}