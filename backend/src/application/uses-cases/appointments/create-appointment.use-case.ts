import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Appointment } from '../../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { v4 as uuid } from 'uuid';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { CLIENT_REPOSITORY } from 'src/domain/repositories/client.repository';

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private appointmentRepository: IAppointmentRepository,
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async execute(input: CreateAppointmentDto): Promise<Appointment> {
    const slot = await this.slotRepository.findById(input.slotId);

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (!slot.isAvailable()) {
      throw new BadRequestException('Slot is not available');
    }
    //change this to get client id from token
    const appointment = new Appointment(uuid(), input.clientId, input.slotId);
    slot.book();

    await this.appointmentRepository.create(appointment);
    await this.slotRepository.update(slot);

    return appointment;
  }
}
