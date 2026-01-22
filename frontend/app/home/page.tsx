'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "../authentication/logout";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const handleLogout = async () => {
    console.log(session)
    logout(session?.idToken || "");
  };

  useEffect(() => {
    // Redirect based on authentication status
    if (status === 'loading') {
      // Still loading session, do nothing
      return;
    }

    if (status === 'authenticated' && session) {
      // User is authenticated, stay on home page
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

  // Show login page by default (for unauthenticated users)
  
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome Home</h1>
      
      {session ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">User Information</h2>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            {session.roles && (
              <p><strong>Roles:</strong> {session.roles.join(', ')}</p>
            )}
            {session.clientRoles && (
              <p><strong>Client Roles:</strong> {session.clientRoles.join(', ')}</p>
            )}
          </div>
          
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/dashboard/providers')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              View Providers
            </button>
            
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600">Please log in to view this page.</p>
          <button 
            onClick={() => router.push('/authentication/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );

}




