import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';
import { CreateProviderDto } from '../../dto/create-provider.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateProviderUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async execute(data: CreateProviderDto, keycloakUserId: string): Promise<Provider> {
    const existingProvider = await this.providerRepository.findByEmail(data.email);
    if (existingProvider) {
      throw new ConflictException('Provider with this email already exists');
    }

    const provider = new Provider(
      uuid(),
      keycloakUserId, // Use provided keycloakUserId
      data.email,
      data.name,
      data.services || [],
      data.phoneNumber || undefined,
      data.address || undefined
    );

    return await this.providerRepository.create(provider);
  }
}
