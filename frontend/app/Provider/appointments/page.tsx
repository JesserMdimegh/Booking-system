'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProvidersApi } from '@/lib/api-entities';
import { useAppointmentsApi } from '@/lib/api-booking';
import { Appointment, Provider } from '@/app/shared/types';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ProviderNavbar from '@/app/components/providerNavbar';

export default function ProviderAppointments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const providersApi = useProvidersApi();
  const appointmentsApi = useAppointmentsApi();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/authentication/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAppointments();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please log in to access this page.');
    }
  }, [session, status]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.email) {
        throw new Error('User session data is incomplete');
      }

      // First get provider data to get the correct database ID
      const providerResponse = await providersApi.getProviderByEmail(session.user.email);
      setProviderData(providerResponse.data);

      // Then use provider's database ID for appointments
      if (providerResponse.data.id) {
        const appointmentsResponse = await appointmentsApi.getAppointmentsByProvider(providerResponse.data.id);
        setAppointments(appointmentsResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load your appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Use provider's database ID for cancellation
      await appointmentsApi.cancelAppointment(appointmentId, providerData?.id || '');
      await fetchAppointments(); // Refresh the list
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    }
  };

  const getNextAppointment = () => {
    const now = new Date();
    return appointments
      .filter(apt => apt.status === 'CONFIRMED' && new Date(apt.slot?.startTime || '') > now)
      .sort((a, b) => new Date(a.slot?.startTime || '').getTime() - new Date(b.slot?.startTime || '').getTime())[0];
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => 
          apt.status === 'CONFIRMED' && new Date(apt.slot?.startTime || '') > now
        );
      case 'past':
        return appointments.filter(apt => 
          new Date(apt.slot?.startTime || '') < now
        );
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'CANCELLED');
      default:
        return appointments;
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

  const getStatusBadge = (status: string) => {
    const variants = {
      CONFIRMED: 'success',
      CANCELLED: 'danger',
      RESCHEDULED: 'warning'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const nextAppointment = getNextAppointment();
  const filteredAppointments = getFilteredAppointments();

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavbar />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavbar />
        <div className="p-6">
          <Alert variant="danger">{error}</Alert>
          <Button onClick={fetchAppointments} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavbar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your appointments
          </p>
        </div>

        {/* Next Appointment Highlight */}
        {nextAppointment && (
          <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-blue-900">Next Appointment</h3>
                  <Badge variant="success" className="animate-pulse">
                    Upcoming
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-blue-800 font-medium">
                    {nextAppointment.client?.name}
                  </p>
                  <p className="text-blue-700">
                    {formatDate(nextAppointment.slot?.startTime || '')}
                  </p>
                  {nextAppointment.slot?.provider?.services && (
                    <div className="flex gap-1 mt-2">
                      {nextAppointment.slot.provider.services.slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="info" size="sm">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAppointment(nextAppointment)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{appointments.length}</div>
              <p className="text-blue-100 mt-1">Total Appointments</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {appointments.filter(apt => apt.status === 'CONFIRMED').length}
              </div>
              <p className="text-green-100 mt-1">Confirmed</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {appointments.filter(apt => 
                  apt.status === 'CONFIRMED' && 
                  new Date(apt.slot?.startTime || '') > new Date()
                ).length}
              </div>
              <p className="text-orange-100 mt-1">Upcoming</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {appointments.filter(apt => apt.status === 'CANCELLED').length}
              </div>
              <p className="text-red-100 mt-1">Cancelled</p>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              { key: 'all', label: 'All Appointments', count: appointments.length },
              { key: 'upcoming', label: 'Upcoming', count: appointments.filter(apt => apt.status === 'CONFIRMED' && new Date(apt.slot?.startTime || '') > new Date()).length },
              { key: 'past', label: 'Past', count: appointments.filter(apt => new Date(apt.slot?.startTime || '') < new Date()).length },
              { key: 'cancelled', label: 'Cancelled', count: appointments.filter(apt => apt.status === 'CANCELLED').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Appointments List */}
        <Card>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'all' 
                    ? "You don't have any appointments yet." 
                    : `No ${filter} appointments found.`
                  }
                </p>
                <Button onClick={() => router.push('/Provider/home')}>
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border rounded-xl p-6 transition-all hover:shadow-lg ${
                    nextAppointment?.id === appointment.id 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.client?.name}
                        </h3>
                        {nextAppointment?.id === appointment.id && (
                          <Badge variant="success" className="animate-pulse">
                            Next
                          </Badge>
                        )}
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(appointment.slot?.startTime || '')}
                        </div>
                        
                        {appointment.client?.email && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {appointment.client.email}
                          </div>
                        )}
                        
                        
                      </div>

                      {appointment.slot?.provider?.services && (
                        <div className="flex gap-1 mt-3">
                          {appointment.slot.provider.services.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="info" size="sm">
                              {service}
                            </Badge>
                          ))}
                          {appointment.slot.provider.services.length > 3 && (
                            <Badge variant="default" size="sm">
                              +{appointment.slot.provider.services.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        View Details
                      </Button>
                      {appointment.status === 'CONFIRMED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCancelModal(true);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Appointment Details Modal */}
        {selectedAppointment && !showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedAppointment.client?.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedAppointment.client?.email}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Appointment Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p><span className="font-medium">Date & Time:</span> {formatDate(selectedAppointment.slot?.startTime || '')}</p>
                      <p><span className="font-medium">Status:</span> {getStatusBadge(selectedAppointment.status)}</p>
                      <p><span className="font-medium">Duration:</span> 1 hour</p>
                    </div>
                  </div>

                  {selectedAppointment.slot?.provider?.services && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.slot.provider.services.map((service, index) => (
                          <Badge key={index} variant="info">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Appointment</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel the appointment with {selectedAppointment.client?.name} on {formatDate(selectedAppointment.slot?.startTime || '')}?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    className="flex-1"
                  >
                    Yes, Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1"
                  >
                    No, Keep
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}