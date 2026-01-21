import { Injectable, Inject } from '@nestjs/common';
import { Appointment } from '../../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private appointmentRepository: IAppointmentRepository,
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async execute(input: CreateAppointmentDto): Promise<Appointment> {
    const slot = await this.slotRepository.findById(input.slotId);

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!slot.isAvailable()) {
      throw new Error('Slot is not available');
    }
    //get client id from token
    const appointment = new Appointment(uuid(), input.clientId, input.slotId);
    slot.book();

    await this.appointmentRepository.create(appointment);
    await this.slotRepository.update(slot);

    return appointment;
  }
}
