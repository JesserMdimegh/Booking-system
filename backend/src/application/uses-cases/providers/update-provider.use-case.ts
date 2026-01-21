import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';
import { UpdateProviderDto } from '../../dto/update-provider.dto';

@Injectable()
export class UpdateProviderUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async execute(id: string, data: UpdateProviderDto): Promise<Provider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (data.name) provider.name = data.name;
    if (data.services) {
      provider.services = data.services;
    }
    provider.updatedAt = new Date();

    return await this.providerRepository.update(provider);
  }

  async delete(id: string): Promise<void> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    await this.providerRepository.delete(id);
  }
}
