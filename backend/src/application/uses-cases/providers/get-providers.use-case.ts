import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';

@Injectable()
export class GetProvidersUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async getAll(): Promise<Provider[]> {
    return await this.providerRepository.findAll();
  }

  async getById(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('Provider not found by id');
    }
    return provider;
  }

  async getByService(service: string): Promise<Provider[]> {
    return await this.providerRepository.findByService(service);
  }

  async findByEmail(email: string): Promise<Provider> {
    const provider = await this.providerRepository.findByEmail(email);
    if (!provider) {
      throw new NotFoundException('Provider not found by email');
    }
    return provider;
  }

  async findByKeycloakUserId(keycloakUserId: string): Promise<Provider | null> {
    return await this.providerRepository.findByKeycloakUserId(keycloakUserId);
  }

  async getProviderAppointments(providerId: string): Promise<any[]> {
    // This would need to be implemented by injecting appointment repository
    // For now, return empty array as placeholder
    return [];
  }

  async getProviderSlots(providerId: string): Promise<any[]> {
    // This would need to be implemented by injecting slot repository
    // For now, return empty array as placeholder
    return [];
  }
}
