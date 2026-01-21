import { Injectable, Inject } from '@nestjs/common';
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

    try{
      const appointments = await this.appointmentRepository.getAll();
      if (!appointments) {
        throw new Error('No appointments found');
      }
      return appointments; 

    } catch (error) {
      throw error;
    }
       

  }
}
