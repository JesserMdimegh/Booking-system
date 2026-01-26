'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProvidersApi } from '@/lib/api-entities';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ClientNavbar from '@/app/components/clientNavbar';
import { Provider } from '@/app/shared/types';

export default function ClientProviders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const providersApi = useProvidersApi();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/authentication/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProviders();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please log in to access this page.');
    }
  }, [status]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await providersApi.getAllProviders();
      setProviders(response.data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAllServices = () => {
    const services = new Set<string>();
    providers.forEach(provider => {
      if (provider.services) {
        provider.services.forEach(service => services.add(service));
      }
    });
    return Array.from(services).sort();
  };

  const getFilteredProviders = () => {
    return providers.filter(provider => {
      const matchesSearch = searchTerm === '' || 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesService = selectedService === 'all' || 
        (provider.services && provider.services.includes(selectedService));
      
      return matchesSearch && matchesService;
    });
  };

  const handleBookAppointment = (providerId: string) => {
    router.push(`/client/book?provider=${providerId}`);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavbar />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavbar />
        <div className="p-6">
          <Alert variant="danger">{error}</Alert>
          <Button onClick={fetchProviders} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredProviders = getFilteredProviders();
  const allServices = getAllServices();

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Providers</h1>
            <p className="text-gray-600 mt-2">
              Discover and connect with healthcare providers
            </p>
          </div>
          <Button
            onClick={() => router.push('/client/book')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Book Appointment
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-100">Available Providers</h3>
                <p className="text-3xl font-bold text-white mt-2">{providers.length}</p>
                <p className="text-blue-100 mt-1">Healthcare professionals ready to help</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Providers</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  {allServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredProviders.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{providers.length}</span> providers
          </p>
          {(searchTerm || selectedService !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedService('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Providers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filters to find available providers.
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedService('all');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Provider Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-green-600">
                          {provider.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">Mr. {provider.name}</h3>
                        <p className="text-sm text-gray-500">{provider.email}</p>
                      </div>
                    </div>
                    <Badge variant="success">Available</Badge>
                  </div>

                  {/* Services */}
                  {provider.services && provider.services.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.services.slice(0, 3).map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                        {provider.services.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{provider.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Provider Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {provider.email}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBookAppointment(provider.id)}
                      className="flex-1"
                    >
                      Book Appointment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/client/book?provider=${provider.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
