'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useClientsApi } from '@/lib/api-entities';
import { useAppointmentsApi } from '@/lib/api-booking';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ClientNavbar from '@/app/components/clientNavbar';
import { Appointment } from '@/app/shared/types';

export default function ClientAppointments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const clientsApi = useClientsApi();
  const appointmentsApi = useAppointmentsApi();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

      // Get client data by email to get the correct database ID
      const clientResponse = await clientsApi.getClientByEmail(session.user.email || '');
      
      if (clientResponse.data.id) {
        // Fetch client's appointments
        const appointmentsResponse = await appointmentsApi.getAppointmentsByClient(clientResponse.data.id);
        setAppointments(appointmentsResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load your appointments. Please try again.');
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

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Get client ID from session
      const clientResponse = await clientsApi.getClientByEmail(session?.user?.email || '');
      await appointmentsApi.cancelAppointment(appointmentId, clientResponse.data.id);
      await fetchAppointments(); // Refresh the list
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    }
  };

  const nextAppointment = getNextAppointment();
  const filteredAppointments = getFilteredAppointments();

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
          <Button onClick={fetchAppointments} className="mt-4">
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
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-2">
              View and manage your healthcare appointments
            </p>
          </div>
          <Button
            onClick={() => router.push('/client/book')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Book New Appointment
          </Button>
        </div>

        {/* Next Appointment */}
        {nextAppointment && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Appointment</h3>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-900">
                    Mr. {nextAppointment.slot?.provider?.name || 'Provider'}
                  </h4>
                  {getStatusBadge(nextAppointment.status)}
                </div>
                <div className="space-y-2 text-sm text-green-700">
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
                  <Button variant="outline" size="sm" onClick={() => router.push('/client/book')}>
                    Reschedule
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => {
                      setSelectedAppointment(nextAppointment);
                      setShowCancelModal(true);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
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
                {appointments.filter(apt => 
                  apt.status === 'CONFIRMED' && 
                  new Date(apt.slot?.startTime || '') > new Date()
                ).length}
              </div>
              <p className="text-green-100 mt-1">Upcoming</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {appointments.filter(apt => 
                  new Date(apt.slot?.startTime || '') < new Date()
                ).length}
              </div>
              <p className="text-orange-100 mt-1">Past</p>
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
                    ? 'border-green-500 text-green-600'
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
                    ? "You haven't booked any appointments yet." 
                    : `No ${filter} appointments found.`
                  }
                </p>
                <Button onClick={() => router.push('/client/book')}>
                  Book Your First Appointment
                </Button>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border rounded-xl p-6 transition-all hover:shadow-lg ${
                    appointment.status === 'CONFIRMED' 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
                      : appointment.status === 'CANCELLED'
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50'
                      : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Mr. {appointment.slot?.provider?.name || 'Provider'}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(appointment.slot?.startTime || '')}
                        </div>
                        
                        {appointment.slot?.provider?.services && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {appointment.slot.provider.services.slice(0, 2).join(', ')}
                          </div>
                        )}

                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Duration: 1 hour
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {appointment.status === 'CONFIRMED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/client/book')}
                          >
                            Reschedule
                          </Button>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Appointment</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel the appointment with Mr. {selectedAppointment.slot?.provider?.name} on {formatDate(selectedAppointment.slot?.startTime || '')}?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  className="flex-1"
                >
                  Cancel Appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1"
                >
                  Keep Appointment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
