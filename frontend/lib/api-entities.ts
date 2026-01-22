import { useApi } from './api-service';
import { Provider, Client, User } from '@/app/shared/types';

export const useProvidersApi = () => {
  const api = useApi();

  return {
    // Get all providers (public endpoint)
    getAllProviders: async () => {
      const response = await api.get<{ message: string; data: Provider[] }>('/providers');
      return response.data;
    },

    // Get provider by ID
    getProviderById: async (id: string) => {
      const response = await api.get<{ message: string; data: Provider }>(`/providers/${id}`);
      return response.data;
    },

    // Get providers by service type
    getProvidersByService: async (service: string) => {
      const response = await api.get<{ message: string; data: Provider[] }>(`/providers/service/${service}`);
      return response.data;
    },

    // Get provider by email
    getProviderByEmail: async (email: string) => {
      const response = await api.get<{ message: string; data: Provider }>(`/providers/email/${email}`);
      return response.data;
    },

    // Get provider appointments
    getProviderAppointments: async (providerId: string) => {
      const response = await api.get<{ message: string; data: any[] }>(`/providers/${providerId}/appointments`);
      return response.data;
    },

    // Get provider slots
    getProviderSlots: async (providerId: string) => {
      const response = await api.get<{ message: string; data: any[] }>(`/providers/${providerId}/slots`);
      return response.data;
    },

    // Create new provider
    createProvider: async (providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<{ message: string; data: Provider }>('/providers', providerData);
      return response.data;
    },

    // Update provider
    updateProvider: async (id: string, providerData: Partial<Provider>) => {
      const response = await api.put<{ message: string; data: Provider }>(`/providers/${id}`, providerData);
      return response.data;
    },

    // Delete provider
    deleteProvider: async (id: string) => {
      const response = await api.delete<{ message: string }>(`/providers/${id}`);
      return response.data;
    },
  };
};

export const useClientsApi = () => {
  const api = useApi();

  return {
    // Get all clients
    getAllClients: async () => {
      const response = await api.get<{ message: string; data: Client[] }>('/clients');
      return response.data;
    },

    // Get client by ID
    getClientById: async (id: string) => {
      const response = await api.get<{ message: string; data: Client }>(`/clients/${id}`);
      return response.data;
    },

    // Get client by email
    getClientByEmail: async (email: string) => {
      const response = await api.get<{ message: string; data: Client }>(`/clients/email/${email}`);
      return response.data;
    },

    // Get client appointments
    getClientAppointments: async (clientId: string) => {
      const response = await api.get<{ message: string; data: any[] }>(`/clients/${clientId}/appointments`);
      return response.data;
    },

    // Create new client
    createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<{ message: string; data: Client }>('/clients', clientData);
      return response.data;
    },

    // Update client
    updateClient: async (id: string, clientData: Partial<Client>) => {
      const response = await api.put<{ message: string; data: Client }>(`/clients/${id}`, clientData);
      return response.data;
    },

    // Delete client
    deleteClient: async (id: string) => {
      const response = await api.delete<{ message: string }>(`/clients/${id}`);
      return response.data;
    },
  };
};

export const useUsersApi = () => {
  const api = useApi();

  return {
    // Get user profile (combined endpoint for both clients and providers)
    getProfile: async () => {
      try {
        // Try to get as client first
        const clientResponse = await api.get<{ message: string; data: Client }>('/clients/profile');
        return { ...clientResponse.data.data, role: 'CLIENT' } as User;
      } catch (clientError) {
        try {
          // Try to get as provider
          const providerResponse = await api.get<{ message: string; data: Provider }>('/providers/profile');
          return { ...providerResponse.data.data, role: 'PROVIDER' } as User;
        } catch (providerError) {
          throw new Error('User profile not found');
        }
      }
    },

    // Update user profile
    updateProfile: async (userData: Partial<User>) => {
      const role = userData.role;
      
      if (role === 'CLIENT') {
        const response = await api.put<{ message: string; data: Client }>(`/clients/${userData.id}`, userData);
        return response.data;
      } else if (role === 'PROVIDER') {
        const response = await api.put<{ message: string; data: Provider }>(`/providers/${userData.id}`, userData);
        return response.data;
      }
      
      throw new Error('Invalid user role');
    },
  };
};
