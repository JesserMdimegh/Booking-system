'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProvidersApi } from '@/lib/api-entities';
import { useSlotsApi } from '@/lib/api-booking';
import { Provider, Slot, Appointment, Client } from '@/app/shared/types';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ProviderNavbar from '@/app/components/providerNavbar';
import { useAppointmentsApi } from '@/lib/api-booking';
import { useClientsApi } from '@/lib/api-entities';
export default function ProviderHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const providersApi = useProvidersApi();
  const appointmentsApi = useAppointmentsApi();
  const slotsApi = useSlotsApi();
  const clientsApi = useClientsApi();

  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') {
      // Session is loading, wait
      return;
    }
    
    if (!session) {
      // No session, redirect to login
      router.push('/authentication/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    // Only fetch data if user is authenticated and session is ready
    if (status === 'authenticated' && session?.user) {
      fetchProviderData();
    } else if (status === 'unauthenticated') {
      // If no session, set loading to false to avoid infinite loading
      setLoading(false);
      setError('Please log in to access this page.');
    }
  }, [session, status]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have the required session data
      if (!session?.user?.email || !session?.user?.id) {
        throw new Error('User session data is incomplete');
      }

      // Use JWT-based profile endpoint instead of email lookup
      const [providerResponse] = await Promise.all([
        providersApi.getProfile()
      ]);

      setProviderData(providerResponse.data);

      // Use the provider's database ID for appointments, slots, and clients
      if (providerResponse.data.id) {
        const [appointmentsResponse, slotsResponse] = await Promise.all([
          appointmentsApi.getAppointmentsByProvider(providerResponse.data.id),
          slotsApi.getSlotsByProvider(providerResponse.data.id)
        ]);

        setAppointments(appointmentsResponse.data);
        setSlots(slotsResponse.data);
        
        // Note: getClientsByProvider endpoint was removed in new architecture
        // Clients are now accessed through appointments
        const clientIds = [...new Set(appointmentsResponse.data.map((apt: Appointment) => apt.clientId))];
        const clientDetails = await Promise.all(
          clientIds.map(clientId => clientsApi.getClientById(clientId))
        );
        setClients(clientDetails.map(response => response.data));
      }
    } catch (err) {
      console.error('Failed to fetch provider data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    try {
      if (!providerData?.id || !formData.date || !formData.startTime || !formData.endTime) {
        setError('Please fill in all fields');
        return;
      }

      await slotsApi.createSlot({
        providerId: providerData.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'AVAILABLE'
      });

      setShowCreateSlot(false);
      setFormData({ date: '', startTime: '', endTime: '' });
      
      // Refresh slots
      const slotsResponse = await slotsApi.getSlotsByProvider(providerData.id);
      setSlots(slotsResponse.data);
    } catch (err) {
      console.error('Failed to create slot:', err);
      setError('Failed to create slot. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsApi.cancelAppointment(appointmentId, session?.user?.id || '');
      // Refresh appointments
      const appointmentsResponse = await appointmentsApi.getAppointmentsByProvider(session?.user?.id || '');
      setAppointments(appointmentsResponse.data);
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
          <Button onClick={fetchProviderData} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {providerData?.name || session?.user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your appointments and availability
          </p>
        </div>

        {/* Next Appointment Highlight */}
        {nextAppointment && (
          <Card className="border-2 border-blue-500 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Next Appointment</h3>
                <p className="text-blue-700 mt-1">
                  {nextAppointment.client?.name} - {formatDate(nextAppointment.slot?.startTime || '')}
                </p>
              </div>
              <Badge variant="success" className="animate-pulse">
                Upcoming
              </Badge>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{appointments.length}</div>
              <p className="text-gray-600 mt-1">Total Appointments</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {appointments.filter(apt => apt.status === 'CONFIRMED').length}
              </div>
              <p className="text-gray-600 mt-1">Confirmed</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{slots.length}</div>
              <p className="text-gray-600 mt-1">Total Slots</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {slots.filter(slot => slot.status === 'AVAILABLE').length}
              </div>
              <p className="text-gray-600 mt-1">Available Slots</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowCreateSlot(true)}
              className="w-full"
            >
              Create New Slot
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/Provider/slots')}
              className="w-full"
            >
              Manage Slots
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/Provider/appointments')}
              className="w-full"
            >
              View All Appointments
            </Button>
            
          </div>
        </Card>

        {/* Create Slot Form */}
        {showCreateSlot && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Create New Slot</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateSlot(false);
                    setFormData({ date: '', startTime: '', endTime: '' });
                  }}
                >
                  ✕
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleCreateSlot}
                  className="flex-1"
                >
                  Create Slot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateSlot(false);
                    setFormData({ date: '', startTime: '', endTime: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Appointments */}
        <Card title="Recent Appointments">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No appointments scheduled.</p>
              
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border rounded-lg p-4 ${
                    nextAppointment?.id === appointment.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {appointment.client?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(appointment.slot?.startTime || '')}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {appointment.slot?.provider?.services?.slice(0, 2).map((service, index) => (
                          <Badge key={index} variant="info" size="sm">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {nextAppointment?.id === appointment.id && (
                        <Badge variant="success" className="animate-pulse">
                          Next
                        </Badge>
                      )}
                      {getStatusBadge(appointment.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/Provider/appointments/${appointment.id}`)}
                      >
                        View
                      </Button>
                      {appointment.status === 'CONFIRMED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => router.push('/Provider/appointments')}
                className="w-full mt-4"
              >
                View All Appointments
              </Button>
            </div>
          )}
        </Card>

        {/* My Clients */}
        <Card title="My Clients">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No clients yet.</p>
              <p className="text-sm mt-2">Clients will appear here when they book appointments with you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-500">{client.email}</p>
                      {client.phoneNumber && (
                        <p className="text-sm text-gray-500">{client.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Client</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/Provider/appointments?client=${client.id}`)}
                    >
                      View Appointments
                    </Button>
                  </div>
                </div>
              ))}
              {clients.length > 5 && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/Provider/clients')}
                  className="w-full mt-4"
                >
                  View All {clients.length} Clients
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Available Slots */}
        <Card title="Your Available Slots">
          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No slots created yet.</p>
              <Button onClick={() => setShowCreateSlot(true)} className="mt-4">
                Create Your First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {slots.filter(slot => slot.status === 'AVAILABLE').slice(0, 5).map((slot) => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {formatDate(slot.startTime)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(slot.endTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Available</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/Provider/slots/${slot.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => router.push('/Provider/slots')}
                className="w-full mt-4"
              >
                Manage All Slots
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}