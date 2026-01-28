import { User } from './user.entity';
import { UserRole } from '../enums/user-role.enum';

export class Provider extends User {
  services: string[]; // Array of service names/descriptions
  phoneNumber?: string;
  address?: string;

  constructor(
    id: string,
    keycloakUserId: string,
    email: string,
    name: string,
    services: string[] = [],
    phoneNumber?: string,
    address?: string,
  ) {
    super(id, keycloakUserId, email, name);
    this.services = services;
    this.phoneNumber = phoneNumber;
    this.address = address;
  }

  create(id: string, keycloakUserId: string, email: string, name: string, services: string[] = [], phoneNumber?: string, address?: string): Provider {
    return new Provider(id, keycloakUserId, email, name, services, phoneNumber, address);
  }

  addService(service: string): void {
    if (this.services.includes(service)) {
      throw new Error('Service already exists');
    }
    this.services.push(service);
  }

  removeService(service: string): void {
    if (!this.services.includes(service)) {
      throw new Error('Service not found');
    }

    this.services = this.services.filter((s) => s !== service);
  }

  hasService(service: string): boolean {
    return this.services.includes(service);
  }
}