import { User } from './user.entity';
import { UserRole } from '../enums/user-role.enum';

export class Client extends User {
  phoneNumber?: string;
  address?: string;

  constructor(
    id: string,
    email: string,
    name: string,
    phoneNumber?: string,
    address?: string,
  ) {
    super(id, email, name, UserRole.CLIENT);
    this.phoneNumber = phoneNumber;
    this.address = address;
  }
  create(id: string, email: string, name: string, phoneNumber?: string, address?: string): Client {
    return new Client(id, email, name, phoneNumber, address);
  }

  updateContactInfo(phoneNumber: string, address: string): void {
    this.phoneNumber = phoneNumber;
    this.address = address;
    this.updatedAt = new Date();
  }
}