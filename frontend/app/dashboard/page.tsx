'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/authentication/login');
      return;
    }

    // If still loading, don't do anything yet
    if (status === 'loading') {
      return;
    }

    // If authenticated, check roles and redirect to appropriate home page
    if (status === 'authenticated' && session?.roles) {
      const userRoles = session.roles; // This is a string containing roles
      console.log('User roles:', userRoles);
      
      // Check if the roles string contains the role we need
      if (userRoles.includes('Provider')) {
        router.push('/Provider/home');
      } else if (userRoles.includes('Client')) {
        router.push('/client/home');
      } else if (userRoles.includes('Admin')) {
        router.push('/admin/home');
      } else {
        // Fallback to regular home if no recognized role is found
        console.log('Fallback to regular home');  
        router.push('/home');
      }
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}