import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Client } from '../../../domain/entities/client.entity';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';

export interface SyncClientFromKeycloakDto {
  id: string;
  keycloakUserId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  address?: string;
}

@Injectable()
export class SyncClientFromKeycloakUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository) {}

  async execute(data: SyncClientFromKeycloakDto): Promise<Client> {
    // Check if client already exists
    let client = await this.clientRepository.findById(data.id);
    
    if (client) {
      // Update existing client
      client.name = data.name;
      client.email = data.email;
      client.phoneNumber = data.phoneNumber;
      client.address = data.address;
      client.updatedAt = new Date();
      
      return await this.clientRepository.update(client);
    } else {
      // Create new client
      client = new Client(
        data.id,
        data.keycloakUserId,
        data.email,
        data.name,
        data.phoneNumber || undefined,
        data.address || undefined
      );
      
      return await this.clientRepository.create(client);
    }
  }

  async findByEmail(email: string): Promise<Client | null> {
    return await this.clientRepository.findByEmail(email);
  }

  async findById(id: string): Promise<Client | null> {
    return await this.clientRepository.findById(id);
  }
}
