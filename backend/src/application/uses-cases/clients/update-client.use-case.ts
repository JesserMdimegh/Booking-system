import { Injectable, Inject } from '@nestjs/common';
import { Client } from '../../../domain/entities/client.entity';
import type { IClientRepository } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import { UpdateClientDto } from '../../dto/update-client.dto';

@Injectable()
export class UpdateClientUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private clientRepository: IClientRepository) {}

  async execute(id: string, data: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    if (data.name) client.name = data.name;
    if (data.phoneNumber !== undefined) client.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) client.address = data.address;
    client.updatedAt = new Date();

    return await this.clientRepository.update(client);
  }
}
