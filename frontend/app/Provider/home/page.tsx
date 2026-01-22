
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProvidersApi } from '@/lib/api-entities';
import { useAppointmentsApi, useSlotsApi } from '@/lib/api-booking';
import { Provider, Slot, Appointment } from '@/app/shared/types';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';

export default function ProviderHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const providersApi = useProvidersApi();
  const appointmentsApi = useAppointmentsApi();
  const slotsApi = useSlotsApi();

  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSlot, setShowCreateSlot] = useState(false);

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [providerResponse, appointmentsResponse] = await Promise.all([
        providersApi.getProviderByEmail(session?.user?.email || ''),
        appointmentsApi.getAppointmentsByProvider(session?.user?.id || '')
      ]);

      setProviderData(providerResponse.data);
      setAppointments(appointmentsResponse.data);

      // Fetch provider slots
      if (providerResponse.data.id) {
        const slotsResponse = await slotsApi.getSlotsByProvider(providerResponse.data.id);
        setSlots(slotsResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch provider data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (slotData: { date: string; startTime: string; endTime: string }) => {
    try {
      if (!providerData?.id) return;

      await slotsApi.createSlot({
        providerId: providerData.id,
        date: slotData.date,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        status: 'AVAILABLE' // Add the missing status property
      });

      setShowCreateSlot(false);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={fetchProviderData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
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
          <Button
            variant="outline"
            onClick={() => router.push('/Provider/profile')}
            className="w-full"
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Create Slot Modal */}
      {showCreateSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4">Create New Slot</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const date = e.target.value;
                    // Store in state or handle as needed
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const startTime = e.target.value;
                    // Store in state or handle as needed
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const endTime = e.target.value;
                    // Store in state or handle as needed
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const date = (document.querySelector('input[type="date"]') as HTMLInputElement).value;
                    const startTime = (document.querySelectorAll('input[type="datetime-local"]')[0] as HTMLInputElement).value;
                    const endTime = (document.querySelectorAll('input[type="datetime-local"]')[1] as HTMLInputElement).value;
                    handleCreateSlot({ date, startTime, endTime });
                  }}
                  className="flex-1"
                >
                  Create Slot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateSlot(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Appointments */}
      <Card title="Recent Appointments">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No appointments scheduled.</p>
            <Button onClick={() => setShowCreateSlot(true)} className="mt-4">
              Create Your First Slot
            </Button>
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
  );
}