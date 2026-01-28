// Define TypeScript interfaces for type safety

// Business entity types (from PostgreSQL)
export interface Client {
  id: string;
  keycloakUserId: string; // 🔗 Bridge to Keycloak
  email: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  keycloakUserId: string; // 🔗 Bridge to Keycloak
  email: string;
  name: string;
  companyName?: string;
  services: string[];
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy User interface for backward compatibility
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  phoneNumber?: string;
  address?: string;
  services?: string[];
  createdAt: string;
  updatedAt: string;
}

// Business logic entities
export interface Slot {
  id: string;
  providerId: string;
  provider?: Provider;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED';
  createdAt: string;
  updatedAt: string;
  appointments?: Appointment[];
}

export interface Appointment {
  id: string;
  clientId: string;
  client?: Client;
  slotId: string;
  slot?: Slot;
  status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard statistics
export interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export interface ProviderDashboardStats extends DashboardStats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export interface ClientDashboardStats extends DashboardStats {
  totalProviders: number;
  bookingsThisMonth: number;
}

// Filter interfaces
export interface SlotFilters {
  providerId?: string;
  date?: string;
  status?: 'AVAILABLE' | 'BOOKED';
  service?: string;
}

export interface AppointmentFilters {
  status?: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  dateFrom?: string;
  dateTo?: string;
  providerId?: string;
}

// Form interfaces (for legacy endpoints)
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password?: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  phoneNumber?: string;
  address?: string;
  services?: string[];
}

export interface SlotForm {
  date: string;
  startTime: string;
  endTime: string;
}

// Keycloak integration types
export interface KeycloakUser {
  sub: string; // Keycloak user ID
  email: string;
  name?: string;
  preferred_username?: string;
  roles: string[];
  email_verified: boolean;
  enabled: boolean;
}

export interface RoleAssignmentRequest {
  username: string;
  roleName: 'Client' | 'Provider';
}

// NextAuth types
import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    roles?: string[];
    clientRoles?: string[];
    user: {
      id?: string;
    } & DefaultSession["user"];
  }

  interface Profile {
    realm_access?: {
      roles: string[];
    };
    resource_access?: {
      [key: string]: {
        roles: string[];
      };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    roles?: string[];
    clientRoles?: string[];
    sub?: string; // Keycloak user ID
  }
}
