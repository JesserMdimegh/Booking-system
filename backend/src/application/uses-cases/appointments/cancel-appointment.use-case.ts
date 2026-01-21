import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private appointmentRepository: IAppointmentRepository,
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async execute(appointmentId: string, clientId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== clientId) {
      throw new UnauthorizedException('Unauthorized to cancel this appointment');
    }

    appointment.cancel();
    const slot = await this.slotRepository.findById(appointment.slotId);
    
    if (slot) {
      slot.release();
      await this.slotRepository.update(slot);
    }

    await this.appointmentRepository.update(appointment);
  }
}
