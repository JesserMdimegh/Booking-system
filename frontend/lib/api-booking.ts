import { useApi } from './api-service';
import { Slot, Appointment, SlotFilters, AppointmentFilters } from '@/app/shared/types';

export const useSlotsApi = () => {
  const api = useApi();

  return {
    // Get slot by ID
    getSlotById: async (id: string) => {
      const response = await api.get<{ message: string; data: Slot }>(`/slots/${id}`);
      return response.data;
    },

    // Get slots by provider
    getSlotsByProvider: async (providerId: string) => {
      const response = await api.get<{ message: string; data: Slot[] }>(`/slots/provider/${providerId}`);
      return response.data;
    },

    // Get available slots for provider
    getAvailableSlots: async (providerId: string, date?: string) => {
      const url = date 
        ? `/slots/available/${providerId}?date=${date}`
        : `/slots/available/${providerId}`;
      
      const response = await api.get<{ message: string; data: Slot[] }>(url);
      return response.data;
    },

    // Create new slot
    createSlot: async (slotData: Omit<Slot, 'id' | 'createdAt' | 'updatedAt' | 'appointments'>) => {
      const response = await api.post<{ message: string; data: Slot }>('/slots', slotData);
      return response.data;
    },

    // Update slot
    updateSlot: async (id: string, slotData: Partial<Slot>) => {
      const response = await api.put<{ message: string; data: Slot }>(`/slots/${id}`, slotData);
      return response.data;
    },

    // Delete slot
    deleteSlot: async (id: string) => {
      const response = await api.delete<{ message: string }>(`/slots/${id}`);
      return response.data;
    },
  };
};

export const useAppointmentsApi = () => {
  const api = useApi();

  return {
    // Get all appointments
    getAllAppointments: async () => {
      const response = await api.get<{ message: string; data: Appointment[] }>('/appointments');
      return response.data;
    },

    // Get appointment by ID
    getAppointmentById: async (id: string) => {
      const response = await api.get<{ message: string; data: Appointment }>(`/appointments/${id}`);
      return response.data;
    },

    // Get appointments by client
    getAppointmentsByClient: async (clientId: string) => {
      const response = await api.get<{ message: string; data: Appointment[] }>(`/appointments/client/${clientId}`);
      return response.data;
    },

    // Get appointments by provider
    getAppointmentsByProvider: async (providerId: string) => {
      const response = await api.get<{ message: string; data: Appointment[] }>(`/appointments/provider/${providerId}`);
      return response.data;
    },

    // Get appointments by date range
    getAppointmentsByDateRange: async (startDate: string, endDate: string) => {
      const response = await api.get<{ message: string; data: Appointment[] }>(
        `/appointments/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    },

    // Get recent appointments (for dashboard)
    getRecentAppointments: async () => {
      const response = await api.get<{ message: string; data: Appointment[] }>('/appointments?limit=5');
      return response.data;
    },

    // Create new appointment
    createAppointment: async (appointmentData: { slotId: string }) => {
      const response = await api.post<{ message: string; data: Appointment }>('/appointments', appointmentData);
      return response.data;
    },

    // Cancel appointment
    cancelAppointment: async (id: string, clientId: string) => {
      const response = await api.delete<{ message: string }>(`/appointments/${id}`, {
        data: { clientId }
      });
      return response.data;
    },

    // Reschedule appointment (using cancel + create pattern)
    rescheduleAppointment: async (id: string, newSlotId: string, clientId: string) => {
      // First cancel the existing appointment
      await api.delete<{ message: string }>(`/appointments/${id}`, {
        data: { clientId }
      });

      // Then create a new appointment with the new slot (clientId comes from JWT)
      const response = await api.post<{ message: string; data: Appointment }>('/appointments', {
        slotId: newSlotId
      });

      return response.data;
    },
  };
};

export const useDashboardApi = () => {
  const api = useApi();

  return {
    // Get dashboard statistics for clients
    getClientStats: async () => {
      // This would need to be implemented in the backend
      // For now, we'll calculate from appointments
      const appointmentsResponse = await api.get<{ message: string; data: Appointment[] }>('/appointments/client/current');
      const appointments = appointmentsResponse.data.data;

      const stats = {
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(apt => 
          new Date(apt.slot?.startTime || '') > new Date() && apt.status === 'CONFIRMED'
        ).length,
        completedAppointments: appointments.filter(apt => 
          new Date(apt.slot?.startTime || '') < new Date() && apt.status === 'CONFIRMED'
        ).length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'CANCELLED').length,
        totalProviders: 0, // Would need separate endpoint
        bookingsThisMonth: appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt || '');
          const now = new Date();
          return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
        }).length,
      };

      return { message: 'Stats retrieved successfully', data: stats };
    },

    // Get dashboard statistics for providers
    getProviderStats: async () => {
      // This would need to be implemented in the backend
      // For now, we'll calculate from appointments and slots
      const [appointmentsResponse, slotsResponse] = await Promise.all([
        api.get<{ message: string; data: Appointment[] }>('/appointments/provider/current'),
        api.get<{ message: string; data: any[] }>('/slots/provider/current')
      ]);

      const appointments = appointmentsResponse.data.data;
      const slots = slotsResponse.data.data;

      const stats = {
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(apt => 
          new Date(apt.slot?.startTime || '') > new Date() && apt.status === 'CONFIRMED'
        ).length,
        completedAppointments: appointments.filter(apt => 
          new Date(apt.slot?.startTime || '') < new Date() && apt.status === 'CONFIRMED'
        ).length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'CANCELLED').length,
        totalSlots: slots.length,
        availableSlots: slots.filter((slot: any) => slot.status === 'AVAILABLE').length,
        bookedSlots: slots.filter((slot: any) => slot.status === 'BOOKED').length,
      };

      return { message: 'Stats retrieved successfully', data: stats };
    },
  };
};
