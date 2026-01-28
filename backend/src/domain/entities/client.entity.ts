import { User } from './user.entity';
import { UserRole } from '../enums/user-role.enum';

export class Client extends User {
  phoneNumber?: string;
  address?: string;

  constructor(
    id: string,
    keycloakUserId: string,
    email: string,
    name: string,
    phoneNumber?: string,
    address?: string,
  ) {
    super(id, keycloakUserId, email, name);
    this.phoneNumber = phoneNumber;
    this.address = address;
  }

  create(id: string, keycloakUserId: string, email: string, name: string, phoneNumber?: string, address?: string): Client {
    return new Client(id, keycloakUserId, email, name, phoneNumber, address);
  }

  updateContactInfo(phoneNumber: string, address: string): void {
    this.phoneNumber = phoneNumber;
    this.address = address;
    this.updatedAt = new Date();
  }
}