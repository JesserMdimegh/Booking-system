import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
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
    const appointment = await this.createAppointmentUseCase.execute(input);
    return { message: 'Appointment created successfully', data: appointment };
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Body('clientId') clientId: string) {
    await this.cancelAppointmentUseCase.execute(id, clientId);
    return { message: 'Appointment cancelled successfully' };
  }
  @Get()
  async getAll() {
    const appointments = await this.listAppointmentsUseCase.execute();
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found', data: [] };
    }
    return { message: 'Appointments retrieved successfully', data: appointments };
  }

  @Get('client/:clientId')
  async getAppointmentsByClient(@Param('clientId') clientId: string) {
    const appointments = await this.listAppointmentsUseCase.executeByClientId(clientId);
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found for this client', data: [] };
    }
    return { message: 'Appointments retrieved successfully', data: appointments };
  }

  @Get('provider/:providerId')
  async getAppointmentsByProvider(@Param('providerId') providerId: string) {
    const appointments = await this.listAppointmentsUseCase.executeByProviderId(providerId);
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found for this provider', data: [] };
    }
    return { message: 'Appointments retrieved successfully', data: appointments };
  }

  @Get('date-range')
  async getAppointmentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const appointments = await this.listAppointmentsUseCase.executeByDateRange(
      new Date(startDate),
      new Date(endDate)
    );
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found in this date range', data: [] };
    }
    return { message: 'Appointments retrieved successfully', data: appointments };
  }

  @Get(':id')
  async getAppointmentById(@Param('id') id: string) {
    const appointment = await this.listAppointmentsUseCase.executeById(id);
    return { message: 'Appointment retrieved successfully', data: appointment };
  }
}
