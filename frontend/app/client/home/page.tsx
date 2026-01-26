'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useClientsApi } from '@/lib/api-entities';
import { useProvidersApi } from '@/lib/api-entities';
import { useAppointmentsApi } from '@/lib/api-booking';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ClientNavbar from '@/app/components/clientNavbar';
import { Appointment, Provider } from '@/app/shared/types';

export default function ClientHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const clientsApi = useClientsApi();
  const providersApi = useProvidersApi();
  const appointmentsApi = useAppointmentsApi();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      fetchClientData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please log in to access this page.');
    }
  }, [session, status]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.email) {
        throw new Error('User session data is incomplete');
      }

      // Get client data by email to get the correct database ID
      const clientResponse = await clientsApi.getClientByEmail(session.user.email || '');
      
      if (clientResponse.data.id) {
        // Fetch client's appointments and available providers
        const [appointmentsResponse, providersResponse] = await Promise.all([
          appointmentsApi.getAppointmentsByClient(clientResponse.data.id),
          providersApi.getAllProviders()
        ]);

        setAppointments(appointmentsResponse.data);
        setProviders(providersResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch client data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNextAppointment = () => {
    const now = new Date();
    return appointments
      .filter(apt => apt.status === 'CONFIRMED' && new Date(apt.slot?.startTime || '') > now)
      .sort((a, b) => new Date(a.slot?.startTime || '').getTime() - new Date(b.slot?.startTime || '').getTime())[0];
  };

  const getPastAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => new Date(apt.slot?.startTime || '') < now);
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
  const pastAppointments = getPastAppointments();

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
          <Button onClick={fetchClientData} className="mt-4">
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
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-green-100 text-lg">
            Manage your appointments and discover healthcare providers
          </p>
        </div>

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
              <p className="text-green-100 mt-1">Upcoming</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{pastAppointments.length}</div>
              <p className="text-orange-100 mt-1">Completed</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{providers.length}</div>
              <p className="text-purple-100 mt-1">Available Providers</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/client/book')}>
            <Card>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Appointment</h3>
                <p className="text-gray-600">Schedule a new appointment with a provider</p>
              </div>
            </Card>
          </div>

          <div className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/client/providers')}>
            <Card>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Providers</h3>
                <p className="text-gray-600">Browse and discover healthcare providers</p>
              </div>
            </Card>
          </div>

          <div className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/client/appointments')}>
            <Card>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Appointments</h3>
                <p className="text-gray-600">View and manage your appointments</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next Appointment */}
          {nextAppointment && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Appointment</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">
                      Dr. {nextAppointment.slot?.provider?.name || 'Provider'}
                    </h4>
                    {getStatusBadge(nextAppointment.status)}
                  </div>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(nextAppointment.slot?.startTime || '')}
                    </div>
                    {nextAppointment.slot?.provider?.services && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {nextAppointment.slot.provider.services.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => router.push('/client/appointments')}>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/client/book')}>
                      Reschedule
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recent Appointments */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                <Button variant="outline" size="sm" onClick={() => router.push('/client/appointments')}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {appointment.slot?.provider?.name || 'Provider'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(appointment.slot?.startTime || '')}
                      </p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                ))}
                {appointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No appointments yet</p>
                    <Button onClick={() => router.push('/client/book')} className="mt-3">
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}