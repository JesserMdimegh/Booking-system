import { Injectable, Inject } from '@nestjs/common';
import { Client } from '../../../domain/entities/client.entity';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';

@Injectable()
export class GetClientsUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository) {}

  async getAll(): Promise<Client[]> {
    return await this.clientRepository.findAll();
  }

  async getById(id: string): Promise<Client | null> {
    return await this.clientRepository.findById(id);
  }

  async findByEmail(email: string): Promise<Client | null> {
    return await this.clientRepository.findByEmail(email);
  }
}
