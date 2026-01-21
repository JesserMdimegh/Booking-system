import { Injectable, Inject } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';
import { CreateProviderDto } from '../../dto/create-provider.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateProviderUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async execute(data: CreateProviderDto): Promise<Provider> {
    const existingProvider = await this.providerRepository.findByEmail(data.email);
    if (existingProvider) {
      throw new Error('Provider with this email already exists');
    }

    const provider = new Provider(
      uuid(),
      data.email,
      data.name,
      data.services || []
    );

    return await this.providerRepository.create(provider);
  }
}
