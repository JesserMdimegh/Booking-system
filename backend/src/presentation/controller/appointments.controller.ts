import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { CreateAppointmentDto } from '../../application/dto/create-appointment.dto';
import { CreateAppointmentUseCase } from 'src/application/uses-cases/appointments/create-appointment.use-case';
import { CancelAppointmentUseCase } from 'src/application/uses-cases/appointments/cancel-appointment.use-case';
import { ListAppointmentsUseCase } from 'src/application/uses-cases/appointments/list-appointments.use-case';
import { RolesGuard } from 'src/infrastructure/auth/roles.guard';
import { UseGuards } from '@nestjs/common';
@Controller('appointments')
@UseGuards(RolesGuard)
export class AppointmentsController {
  constructor(
    private createAppointmentUseCase: CreateAppointmentUseCase,
    private cancelAppointmentUseCase: CancelAppointmentUseCase,
    private listAppointmentsUseCase: ListAppointmentsUseCase,
  ) {}

  @Post()
  async create(@Body() input: CreateAppointmentDto) {
    return this.createAppointmentUseCase.execute(input);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Body('clientId') clientId: string) {
    await this.cancelAppointmentUseCase.execute(id, clientId);
    return { message: 'Appointment cancelled successfully' };
  }
  @Get()
  async getAll() {
    try {
      const appointments = await this.listAppointmentsUseCase.execute();
      if (!appointments || appointments.length === 0) {
        return { message: 'No appointments found', data: [] };
      }
      return { message: 'Appointments retrieved successfully', data: appointments };
    } catch (error) {
      throw new Error(`Failed to retrieve appointments: ${error.message}`);
    }
  }
}
