import { Controller, Get, Post, Put, Param, Body, NotFoundException } from '@nestjs/common';
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
  ) {}

  @Post()
  async createClient(@Body() data: CreateClientDto) {
    try {
      const client = await this.createClientUseCase.execute(data);
      return { message: 'Client created successfully', data: client };
    } catch (error) {
      throw new NotFoundException(`Failed to create client: ${error.message}`);
    }
  }

  @Get()
  async getAllClients() {
    try {
      const clients = await this.getClientsUseCase.getAll();
      if (!clients || clients.length === 0) {
        return { message: 'No clients found', data: [] };
      }
      return { message: 'Clients retrieved successfully', data: clients };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve clients: ${error.message}`);
    }
  }

  @Get(':id')
  async getClientById(@Param('id') id: string) {
    try {
      const client = await this.getClientsUseCase.getById(id);
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      return { message: 'Client retrieved successfully', data: client };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve client: ${error.message}`);
    }
  }

  @Get('email/:email')
  async getClientByEmail(@Param('email') email: string) {
    try {
      const client = await this.getClientsUseCase.findByEmail(email);
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      return { message: 'Client retrieved successfully', data: client };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve client: ${error.message}`);
    }
  }

  @Put(':id')
  async updateClient(@Param('id') id: string, @Body() data: UpdateClientDto) {
    try {
      const client = await this.updateClientUseCase.execute(id, data);
      return { message: 'Client updated successfully', data: client };
    } catch (error) {
      throw new NotFoundException(`Failed to update client: ${error.message}`);
    }
  }
}
