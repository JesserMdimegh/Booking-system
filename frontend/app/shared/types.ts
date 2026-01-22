// Define TypeScript interfaces for type safety
export interface Provider {
  id: string;
  email: string;
  name: string;
  role: 'PROVIDER';
  services: string[];
  createdAt: string;
  updatedAt: string;
}

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

export interface Client extends User {
  role: 'CLIENT';
  phoneNumber?: string;
  address?: string;
}

export interface Slot {
  id: string;
  providerId: string;
  provider?: User;
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
  client?: User;
  slotId: string;
  slot?: Slot;
  status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt: string;
  updatedAt: string;
}

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
  }
}
