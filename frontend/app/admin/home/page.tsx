'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/app/components/ui';

export default function AdminHome() {
  const { data: session } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalProviders: 0,
    totalClients: 0,
    totalAppointments: 0,
    totalSlots: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock stats for now - would be replaced with actual API calls
      const mockStats = {
        totalProviders: 25,
        totalClients: 150,
        totalAppointments: 450,
        totalSlots: 800
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockStats);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('Failed to load admin dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <Button onClick={fetchAdminStats} className="mt-4">
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
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage the entire booking system
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalProviders}</div>
            <p className="text-gray-600 mt-1">Total Providers</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalClients}</div>
            <p className="text-gray-600 mt-1">Total Clients</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalAppointments}</div>
            <p className="text-gray-600 mt-1">Total Appointments</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.totalSlots}</div>
            <p className="text-gray-600 mt-1">Total Slots</p>
          </div>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card title="System Management">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push('/admin/providers')}
            className="w-full"
          >
            Manage Providers
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/clients')}
            className="w-full"
          >
            Manage Clients
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/appointments')}
            className="w-full"
          >
            View All Appointments
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/slots')}
            className="w-full"
          >
            Manage Slots
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="w-full"
          >
            User Management
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/settings')}
            className="w-full"
          >
            System Settings
          </Button>
        </div>
      </Card>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">New provider registered</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Appointment cancelled</span>
              <span className="text-xs text-gray-500">3 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">New client registered</span>
              <span className="text-xs text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">System backup completed</span>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </Card>

        <Card title="System Health">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Database Status</span>
              <Badge variant="success">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Response Time</span>
              <Badge variant="success">120ms</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Server Uptime</span>
              <Badge variant="success">99.9%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Storage Usage</span>
              <Badge variant="warning">65%</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card title="Quick Reports">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/reports/appointments')}
            className="w-full"
          >
            Appointment Report
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/reports/revenue')}
            className="w-full"
          >
            Revenue Report
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/reports/usage')}
            className="w-full"
          >
            Usage Analytics
          </Button>
        </div>
      </Card>
    </div>
  );
}
