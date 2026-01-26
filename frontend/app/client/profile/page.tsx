'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useClientsApi } from '@/lib/api-entities';
import { useAppointmentsApi } from '@/lib/api-booking';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ClientNavbar from '@/app/components/clientNavbar';
import { Appointment, Client } from '@/app/shared/types';

export default function ClientProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const clientsApi = useClientsApi();
  const appointmentsApi = useAppointmentsApi();

  const [clientData, setClientData] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: ''
  });

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

      // Get client data by email
      const clientResponse = await clientsApi.getClientByEmail(session.user.email || '');
      setClientData(clientResponse.data);
      
      // Set form data
      setFormData({
        name: clientResponse.data.name || '',
        phoneNumber: clientResponse.data.phoneNumber || '',
        address: clientResponse.data.address || ''
      });

      // Fetch client's appointments
      if (clientResponse.data.id) {
        const appointmentsResponse = await appointmentsApi.getAppointmentsByClient(clientResponse.data.id);
        setAppointments(appointmentsResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch client data:', err);
      setError('Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!clientData?.id) return;

      await clientsApi.updateClient(clientData.id, formData);
      setClientData({ ...clientData, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal information and appointment history
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
          {/* Profile Information */}
          <Card className="lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center justify-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">
                        {clientData?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {clientData?.name || session?.user?.name}
                    </h4>
                    <p className="text-gray-500">{clientData?.email || session?.user?.email}</p>
                    <Badge variant="success" className="mt-2">Client</Badge>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-gray-900">
                        {clientData?.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {clientData?.address || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-gray-900">
                        {clientData?.createdAt ? formatDate(clientData.createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: clientData?.name || '',
                          phoneNumber: clientData?.phoneNumber || '',
                          address: clientData?.address || ''
                        });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Appointment Statistics */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                  <p className="text-sm text-blue-600">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {appointments.filter(apt => apt.status === 'CONFIRMED').length}
                  </div>
                  <p className="text-sm text-green-600">Confirmed</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {appointments.filter(apt => new Date(apt.slot?.startTime || '') < new Date()).length}
                  </div>
                  <p className="text-sm text-orange-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {appointments.filter(apt => apt.status === 'CANCELLED').length}
                  </div>
                  <p className="text-sm text-red-600">Cancelled</p>
                </div>
              </div>

              {/* Recent Appointments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Appointments</h4>
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Dr. {appointment.slot?.provider?.name || 'Provider'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(appointment.slot?.startTime || '')}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No appointments yet</p>
                      <Button onClick={() => router.push('/client/book')} className="mt-3">
                        Book First Appointment
                      </Button>
                    </div>
                  )}
                  {appointments.length > 5 && (
                    <div className="text-center pt-3">
                      <Button variant="outline" size="sm" onClick={() => router.push('/client/appointments')}>
                        View All Appointments
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
