import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { CreateClientUseCase } from '../../application/uses-cases/clients/create-client.use-case';
import { GetClientsUseCase } from '../../application/uses-cases/clients/get-clients.use-case';
import { UpdateClientUseCase } from '../../application/uses-cases/clients/update-client.use-case';
import { CreateClientDto } from '../../application/dto/create-client.dto';
import { UpdateClientDto } from '../../application/dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(
    private createClientUseCase: CreateClientUseCase,
    private getClientsUseCase: GetClientsUseCase,
    private updateClientUseCase: UpdateClientUseCase,
  ) { }

  @Post()
  async createClient(@Body() data: CreateClientDto) {
    const client = await this.createClientUseCase.execute(data);
    return { message: 'Client created successfully', data: client };
  }

  @Get()
  async getAllClients() {
    const clients = await this.getClientsUseCase.getAll();
    if (!clients || clients.length === 0) {
      return { message: 'No clients found', data: [] };
    }
    return { message: 'Clients retrieved successfully', data: clients };
  }

  @Get(':id')
  async getClientById(@Param('id') id: string) {
    const client = await this.getClientsUseCase.getById(id);
    return { message: 'Client retrieved successfully', data: client };
  }

  @Get('email/:email')
  async getClientByEmail(@Param('email') email: string) {
    const client = await this.getClientsUseCase.findByEmail(email);
    return { message: 'Client retrieved successfully', data: client };
  }

  @Get(':id/appointments')
  async getClientAppointments(@Param('id') id: string) {
    const appointments = await this.getClientsUseCase.getClientAppointments(id);
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found for this client', data: [] };
    }
    return { message: 'Client appointments retrieved successfully', data: appointments };
  }

  @Get('provider/:providerId')
  async getClientsByProvider(@Param('providerId') providerId: string) {
    const clients = await this.getClientsUseCase.findByProvider(providerId);
    if (!clients || clients.length === 0) {
      return { message: 'No clients found for this provider', data: [] };
    }
    return { message: 'Clients retrieved successfully', data: clients };
  }

  @Put(':id')
  async updateClient(@Param('id') id: string, @Body() data: UpdateClientDto) {
    const client = await this.updateClientUseCase.execute(id, data);
    return { message: 'Client updated successfully', data: client };
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    await this.updateClientUseCase.delete(id);
    return { message: 'Client deleted successfully' };
  }
}
