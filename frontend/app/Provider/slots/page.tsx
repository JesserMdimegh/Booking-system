'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProvidersApi } from '@/lib/api-entities';
import { useSlotsApi } from '@/lib/api-booking';
import { Slot, Provider } from '@/app/shared/types';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';
import ProviderNavbar from '@/app/components/providerNavbar';

export default function ProviderSlots() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const providersApi = useProvidersApi();
  const slotsApi = useSlotsApi();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: ''
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
      fetchSlots();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please log in to access this page.');
    }
  }, [session, status]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.email) {
        throw new Error('User session data is incomplete');
      }

      // First get provider data to get the correct database ID
      const providerResponse = await providersApi.getProviderByEmail(session.user.email || '');
      setProviderData(providerResponse.data);

      // Then use provider's database ID for slots
      if (providerResponse.data.id) {
        const slotsResponse = await slotsApi.getSlotsByProvider(providerResponse.data.id);
        setSlots(slotsResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setError('Failed to load your slots. Please try again.');
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

      setShowCreateModal(false);
      setFormData({ date: '', startTime: '', endTime: '' });
      await fetchSlots();
    } catch (err) {
      console.error('Failed to create slot:', err);
      setError('Failed to create slot. Please try again.');
    }
  };

  const handleUpdateSlot = async () => {
    try {
      if (!selectedSlot?.id) return;

      await slotsApi.updateSlot(selectedSlot.id, {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: selectedSlot.status
      });

      setShowEditModal(false);
      setSelectedSlot(null);
      setFormData({ date: '', startTime: '', endTime: '' });
      await fetchSlots();
    } catch (err) {
      console.error('Failed to update slot:', err);
      setError('Failed to update slot. Please try again.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await slotsApi.deleteSlot(slotId);
      await fetchSlots();
    } catch (err) {
      console.error('Failed to delete slot:', err);
      setError('Failed to delete slot. Please try again.');
    }
  };

  const getFilteredSlots = () => {
    switch (filter) {
      case 'available':
        return slots.filter(slot => slot.status === 'AVAILABLE');
      case 'booked':
        return slots.filter(slot => slot.status === 'BOOKED');
      default:
        return slots;
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
      AVAILABLE: 'success',
      BOOKED: 'danger',
      CANCELLED: 'warning'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const openEditModal = (slot: Slot) => {
    setSelectedSlot(slot);
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
    setShowEditModal(true);
  };

  const filteredSlots = getFilteredSlots();

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
          <Button onClick={fetchSlots} className="mt-4">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Slots</h1>
            <p className="text-gray-600 mt-2">
              Manage your availability and appointment slots
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Create New Slot
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{slots.length}</div>
              <p className="text-blue-100 mt-1">Total Slots</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {slots.filter(slot => slot.status === 'AVAILABLE').length}
              </div>
              <p className="text-green-100 mt-1">Available</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {slots.filter(slot => slot.status === 'BOOKED').length}
              </div>
              <p className="text-orange-100 mt-1">Booked</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {slots.length > 0 ? Math.round((slots.filter(slot => slot.status === 'BOOKED').length / slots.length) * 100) : 0}%
              </div>
              <p className="text-purple-100 mt-1">Utilization</p>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              { key: 'all', label: 'All Slots', count: slots.length },
              { key: 'available', label: 'Available', count: slots.filter(slot => slot.status === 'AVAILABLE').length },
              { key: 'booked', label: 'Booked', count: slots.filter(slot => slot.status === 'BOOKED').length }
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

        {/* Slots List */}
        <Card>
          <div className="space-y-4">
            {filteredSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No slots found</h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'all' 
                    ? "You haven't created any slots yet." 
                    : `No ${filter} slots found.`
                  }
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Slot
                </Button>
              </div>
            ) : (
              filteredSlots.map((slot) => (
                <div 
                  key={slot.id} 
                  className={`border rounded-xl p-6 transition-all hover:shadow-lg ${
                    slot.status === 'AVAILABLE' 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
                      : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(slot.startTime)}
                        </h3>
                        {getStatusBadge(slot.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(slot.startTime)} - {formatDate(slot.endTime)}
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Duration: {Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60))} minutes
                        </div>

                        {slot.appointments && slot.appointments.length > 0 && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {slot.appointments.length} appointment{slot.appointments.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {slot.status === 'AVAILABLE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(slot)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this slot?')) {
                            handleDeleteSlot(slot.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Create Slot Form */}
        {showCreateModal && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Create New Slot</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
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
                    setShowCreateModal(false);
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

        {/* Edit Slot Modal */}
        {showEditModal && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Slot</h2>
                <div className="space-y-4">
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
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateSlot}
                      className="flex-1"
                    >
                      Update Slot
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedSlot(null);
                        setFormData({ date: '', startTime: '', endTime: '' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}