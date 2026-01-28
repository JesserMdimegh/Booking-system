import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Request } from '@nestjs/common';
import { CreateClientUseCase } from '../../application/uses-cases/clients/create-client.use-case';
import { GetClientsUseCase } from '../../application/uses-cases/clients/get-clients.use-case';
import { UpdateClientUseCase } from '../../application/uses-cases/clients/update-client.use-case';
import { CreateClientDto } from '../../application/dto/create-client.dto';
import { UpdateClientDto } from '../../application/dto/update-client.dto';
import { Public } from '../../infrastructure/auth/public.decorator';
import { KeycloakSyncClientAuthGuard } from '../../infrastructure/auth/keycloak-sync-client-auth.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(KeycloakSyncClientAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private createClientUseCase: CreateClientUseCase,
    private getClientsUseCase: GetClientsUseCase,
    private updateClientUseCase: UpdateClientUseCase,
  ) { }

  @Post()
  async createClient(@Body() data: CreateClientDto, @Request() req: any) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const client = await this.createClientUseCase.execute(data, keycloakUserId);
    return { message: 'Client created successfully', data: client };
  }

  @Public()
  @Get()
  async getAllClients() {
    const clients = await this.getClientsUseCase.getAll();
    if (!clients || clients.length === 0) {
      return { message: 'No clients found', data: [] };
    }
    return { message: 'Clients retrieved successfully', data: clients };
  }

  @Get('profile')
  async getCurrentClientProfile(@Request() req: any) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const client = await this.getClientsUseCase.findByKeycloakUserId(keycloakUserId);
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return { message: 'Client profile retrieved successfully', data: client };
  }

  @Public()
  @Get(':id')
  async getClientById(@Param('id') id: string) {
    const client = await this.getClientsUseCase.getById(id);
    return { message: 'Client retrieved successfully', data: client };
  }

  @Public()
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

  @Put('profile')
  async updateCurrentClientProfile(@Request() req: any, @Body() data: Partial<UpdateClientDto>) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const client = await this.getClientsUseCase.findByKeycloakUserId(keycloakUserId);
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    
    const updatedClient = await this.updateClientUseCase.execute(client.id, data);
    return { message: 'Client profile updated successfully', data: updatedClient };
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    await this.updateClientUseCase.delete(id);
    return { message: 'Client deleted successfully' };
  }
}
