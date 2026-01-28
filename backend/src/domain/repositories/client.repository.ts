import { Client } from '../entities/client.entity';

export interface IClientRepository {
  create(client: Client): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  findByKeycloakUserId(keycloakUserId: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  findByProvider(providerId: string): Promise<Client[]>;
  update(client: Client): Promise<Client>;
  delete(id: string): Promise<void>;
}

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';