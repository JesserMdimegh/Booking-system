import { User } from './user.entity';
import { UserRole } from '../enums/user-role.enum';

export class Provider extends User {
  services: string[]; // Array of service names/descriptions

  constructor(
    id: string,
    email: string,
    name: string,
    services: string[] = [],
  ) {
    super(id, email, name, UserRole.PROVIDER);
    this.services = services;
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