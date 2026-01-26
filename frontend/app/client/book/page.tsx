'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProvidersApi } from '@/lib/api-entities';
import { useSlotsApi } from '@/lib/api-booking';
import { useAppointmentsApi } from '@/lib/api-booking';
import { useClientsApi } from '@/lib/api-entities';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ClientNavbar from '@/app/components/clientNavbar';
import { Provider, Slot } from '@/app/shared/types';

export default function BookAppointment() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const providersApi = useProvidersApi();
  const slotsApi = useSlotsApi();
  const appointmentsApi = useAppointmentsApi();
  const clientsApi = useClientsApi();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

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

  useEffect(() => {
    // Check if provider is pre-selected from URL params
    const providerId = searchParams.get('provider');
    if (providerId && providers.length > 0) {
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        setSelectedProvider(provider);
        fetchProviderSlots(provider.id);
      }
    }
  }, [providers, searchParams]);

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

  const fetchProviderSlots = async (providerId: string) => {
    try {
      const response = await slotsApi.getSlotsByProvider(providerId);
      // Filter only available slots that are in the future
      const availableSlots = response.data.filter(slot => 
        slot.status === 'AVAILABLE' && 
        new Date(slot.startTime) > new Date()
      );
      setAvailableSlots(availableSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setError('Failed to load available slots. Please try again.');
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedSlot(null);
    fetchProviderSlots(provider.id);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      setError(null);

      // Get client ID from session
      const clientResponse = await clientsApi.getClientByEmail(session?.user?.email || '');
      
      // Create appointment
      await appointmentsApi.createAppointment({
        slotId: selectedSlot.id
      });

      // Redirect to appointments page on success
      router.push('/client/appointments');
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Date string:', dateString);
      return 'Invalid date';
    }
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
          <Button onClick={() => setError(null)} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600 mt-2">
              Choose a provider and select an available time slot
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/client/home')}
          >
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Providers List */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Provider</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">
                          {provider.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-gray-900">Mr. {provider.name}</h4>
                        <p className="text-sm text-gray-500">{provider.email}</p>
                        {provider.services && provider.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.services.slice(0, 2).map((service, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {service}
                              </span>
                            ))}
                            {provider.services.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{provider.services.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedProvider?.id === provider.id && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Available Slots */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Slots
                {selectedProvider && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    - Mr. {selectedProvider.name}
                  </span>
                )}
              </h3>
              
              {!selectedProvider ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Please select a provider first</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No available slots for this provider</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(slot.startTime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(slot.endTime)}
                          </p>
                        </div>
                        {selectedSlot?.id === slot.id && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Booking Summary */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              {!selectedProvider && !selectedSlot ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Select provider and time slot to continue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProvider && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Provider</h4>
                      <p className="text-gray-700">Mr. {selectedProvider.name}</p>
                      <p className="text-sm text-gray-500">{selectedProvider.email}</p>
                    </div>
                  )}
                  
                  {selectedSlot && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Time Slot</h4>
                      <p className="text-gray-700">{formatDate(selectedSlot.startTime)}</p>
                      <p className="text-sm text-gray-500">{formatDate(selectedSlot.endTime)}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleBookAppointment}
                      disabled={!selectedSlot || bookingLoading}
                      className="w-full"
                    >
                      {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
