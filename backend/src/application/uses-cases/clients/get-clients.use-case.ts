import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Client } from '../../../domain/entities/client.entity';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';

@Injectable()
export class GetClientsUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository) {}

  async getAll(): Promise<Client[]> {
    return await this.clientRepository.findAll();
  }

  async getById(id: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async findByEmail(email: string): Promise<Client> {
    if (!email) {
      throw new NotFoundException('Email is required');
    }
    
    const client = await this.clientRepository.findByEmail(email);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async getClientAppointments(clientId: string): Promise<any[]> {
    // This would need to be implemented by injecting appointment repository
    // For now, return empty array as placeholder
    return [];
  }

  async findByProvider(providerId: string): Promise<Client[]> {
    if (!providerId) {
      throw new NotFoundException('Provider ID is required');
    }
    
    return await this.clientRepository.findByProvider(providerId);
  }
}
