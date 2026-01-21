import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Appointment } from '../../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ListAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private appointmentRepository: IAppointmentRepository,
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async execute(): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository.getAll();
    return appointments;
  }

  async executeById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async executeByClientId(clientId: string): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository.findByClientId(clientId);
    return appointments;
  }

  async executeByProviderId(providerId: string): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository.findByProviderId(providerId);
    return appointments;
  }

  async executeByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository.findByDateRange(startDate, endDate);
    return appointments;
  }
}
