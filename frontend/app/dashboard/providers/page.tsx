'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Provider, ApiResponse } from '@/app/shared/types';


export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get<ApiResponse<Provider[]>>('/providers');
        
        if (response.data && Array.isArray(response.data.data)) {
          setProviders(response.data.data);
        } else {
          setProviders([]);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
        setError('Failed to load providers. Please try again later.');
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Providers</h1>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading providers...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No providers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div key={provider.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-gray-600">{provider.email}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.services.length > 0 ? (
                        provider.services.map((service, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic">No services listed</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Member since: {new Date(provider.createdAt).toLocaleDateString()}</p>
                    <p>Last updated: {new Date(provider.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
