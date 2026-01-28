import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Provider } from '../../../domain/entities/Provider.entity';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';

export interface SyncProviderFromKeycloakDto {
  id: string;
  keycloakUserId: string;
  email: string;
  name: string;
  services?: string[];
  phoneNumber?: string;
  address?: string;
}

@Injectable()
export class SyncProviderFromKeycloakUseCase {
  constructor(@Inject(PROVIDER_REPOSITORY) private providerRepository: IProviderRepository) {}

  async execute(data: SyncProviderFromKeycloakDto): Promise<Provider> {
    // Check if provider already exists
    let provider = await this.providerRepository.findById(data.id);
    
    if (provider) {
      // Update existing provider
      provider.name = data.name;
      provider.email = data.email;
      provider.services = data.services || [];
      provider.phoneNumber = data.phoneNumber;
      provider.address = data.address;
      provider.updatedAt = new Date();
      
      return await this.providerRepository.update(provider);
    } else {
      // Create new provider
      provider = new Provider(
        data.id,
        data.keycloakUserId,
        data.email,
        data.name,
        data.services || [],
        data.phoneNumber || undefined,
        data.address || undefined
      );
      
      return await this.providerRepository.create(provider);
    }
  }

  async findByEmail(email: string): Promise<Provider | null> {
    return await this.providerRepository.findByEmail(email);
  }

  async findById(id: string): Promise<Provider | null> {
    return await this.providerRepository.findById(id);
  }
}
