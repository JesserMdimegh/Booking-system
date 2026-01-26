'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../authentication/logout";
import { useUsersApi } from "@/lib/api-entities";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const usersApi = useUsersApi();
  
  const [selectedRole, setSelectedRole] = useState<'Client' | 'Provider' | null>(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleLogout = async () => {
    console.log(session)
    logout(session?.idToken || "");
  };

  const handleRoleAssignment = async () => {
    if (!selectedRole || !session?.user?.email) return;
    
    try {
      setIsAssigningRole(true);
      setError(null);
      setSuccess(null);
      
      // Extract username from email (before @)
      const username = session.user.email.split('@')[0];
      
      // Assign role via Keycloak API
      await usersApi.assignRole(username, selectedRole);
      
      setSuccess(`Successfully assigned ${selectedRole} role! Redirecting to dashboard...`);
      
      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Role assignment error:', err);
      setError('Failed to assign role. Please try again.');
    } finally {
      setIsAssigningRole(false);
    }
  };

  useEffect(() => {
    console.log("sesss:",session);
    // Redirect based on authentication status
    if (status === 'loading') {
      // Still loading session, do nothing
      return;
    }

    if (status === 'authenticated' && session) {
      // Check if user already has roles
      const hasRoles = session.roles && session.roles.length > 0;
      const hasClientRoles = session.clientRoles && session.clientRoles.length > 0;
      
      /*if (hasRoles || hasClientRoles) {
        // User already has roles, redirect to dashboard
        router.push('/dashboard');
        return;
      }*/
      
      // User is authenticated but has no roles, stay on this page for role selection
      return;
    }

    if (status === 'unauthenticated') {
      // User is not authenticated, redirect to login
      router.push('/authentication/login');
    }
  }, [status, session, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Role selection page for authenticated users without roles
  if (status === 'authenticated' && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
              <p className="text-gray-600">
                Hello, {session.user?.name || session.user?.email}!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please select your role to continue
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 text-center">Choose Your Role</h3>
              
              {/* Client Option */}
              <button
                onClick={() => setSelectedRole('Client')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'Client'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Client</h4>
                    <p className="text-sm text-gray-600">Book appointments with providers</p>
                  </div>
                  {selectedRole === 'Client' && (
                    <svg className="w-5 h-5 text-blue-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Provider Option */}
              <button
                onClick={() => setSelectedRole('Provider')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'Provider'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Provider</h4>
                    <p className="text-sm text-gray-600">Manage appointments and time slots</p>
                  </div>
                  {selectedRole === 'Provider' && (
                    <svg className="w-5 h-5 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRoleAssignment}
                disabled={!selectedRole || isAssigningRole}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAssigningRole ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning Role...
                  </div>
                ) : (
                  `Continue as ${selectedRole || '...'}`
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login page for unauthenticated users
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Please log in to view this page.</p>
        <button 
          onClick={() => router.push('/authentication/login')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    </div>
  );
}
