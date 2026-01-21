import { Module } from '@nestjs/common';
import { PrismaAppointmentRepository } from 'src/infrastructure/repositories/prisma-appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../domain/repositories/appointment.repository';
import { CreateAppointmentUseCase } from 'src/application/uses-cases/appointments/create-appointment.use-case';
import { CancelAppointmentUseCase } from 'src/application/uses-cases/appointments/cancel-appointment.use-case';
import { AppointmentsController } from 'src/presentation/controller/appointments.controller';
import { SlotsModule } from './slots.module';
import { PrismaModule } from 'src/shared/infrastructure/prisma.module';
import { ListAppointmentsUseCase } from 'src/application/uses-cases/appointments/list-appointments.use-case';

@Module({
  imports: [PrismaModule, SlotsModule],
  providers: [
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
    CreateAppointmentUseCase,
    CancelAppointmentUseCase,
    ListAppointmentsUseCase
  ],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
