import { Provider } from "../entities/Provider.entity";

export interface IProviderRepository {
  create(provider: Provider): Promise<Provider>;
  findById(id: string): Promise<Provider | null>;
  findByEmail(email: string): Promise<Provider | null>;
  findByKeycloakUserId(keycloakUserId: string): Promise<Provider | null>;
  findAll(): Promise<Provider[]>;
  findByService(service: string): Promise<Provider[]>;
  update(provider: Provider): Promise<Provider>;
  delete(id: string): Promise<void>;
}

export const PROVIDER_REPOSITORY = 'PROVIDER_REPOSITORY';