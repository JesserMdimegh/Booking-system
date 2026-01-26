import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Appointment } from '../../../domain/entities/appointment.entity';
import type { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { v4 as uuid } from 'uuid';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private appointmentRepository: IAppointmentRepository,
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
    @Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository,
  ) {}

  async execute(input: CreateAppointmentDto, req: any): Promise<Appointment> {
    // Get clientId from authenticated user (Keycloak strategy returns userId)
    const clientId = req.user?.userId || req.user?.sub;
    console.log('Client ID from token:', clientId);
    console.log('Full user object:', req.user);
    
    if (!clientId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify client exists in database
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found in database`);
    }
    console.log('Found client:', client);

    const slot = await this.slotRepository.findById(input.slotId);

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (!slot.isAvailable()) {
      throw new BadRequestException('Slot is not available');
    }
    
    // Get clientId from token
    const appointment = new Appointment(uuid(), clientId, input.slotId);
    slot.book();

    await this.appointmentRepository.create(appointment);
    await this.slotRepository.update(slot);

    return appointment;
  }
}
