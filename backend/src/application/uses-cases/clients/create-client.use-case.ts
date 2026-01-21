import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Client } from '../../../domain/entities/client.entity';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import { CreateClientDto } from '../../dto/create-client.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateClientUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository) {}

  async execute(data: CreateClientDto): Promise<Client> {
    const existingClient = await this.clientRepository.findByEmail(data.email);
    if (existingClient) {
      throw new ConflictException('Client with this email already exists');
    }

    const client = new Client(
      uuid(),
      data.email,
      data.name,
      data.phoneNumber,
      data.address
    );

    return await this.clientRepository.create(client);
  }
}
