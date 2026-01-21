import { AppointmentStatus } from '../enums/appointment-status.enum';

export class Appointment {
  id: string;
  clientId: string;
  slotId: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, clientId: string, slotId: string) {
    this.id = id;
    this.clientId = clientId;
    this.slotId = slotId;
    this.status = AppointmentStatus.CONFIRMED;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === AppointmentStatus.CANCELLED) {
      throw new Error('Appointment is already cancelled');
    }
    this.status = AppointmentStatus.CANCELLED;
  }

  reschedule(): void {
    this.status = AppointmentStatus.RESCHEDULED;
  }
}
