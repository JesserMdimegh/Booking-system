import { Injectable, Inject } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';

@Injectable()
export class GetProvidersUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async getAll(): Promise<Provider[]> {
    return await this.providerRepository.findAll();
  }

  async getById(id: string): Promise<Provider | null> {
    return await this.providerRepository.findById(id);
  }

  async getByService(service: string): Promise<Provider[]> {
    return await this.providerRepository.findByService(service);
  }

  async findByEmail(email: string): Promise<Provider | null> {
    return await this.providerRepository.findByEmail(email);
  }
}
