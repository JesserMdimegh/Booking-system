import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByClientId(clientId: string): Promise<Appointment[]>;
  findByProviderId(providerId: string): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  findBySlotId(slotId: string): Promise<Appointment | null>;
  update(appointment: Appointment): Promise<Appointment>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Appointment[]>;
}

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';
