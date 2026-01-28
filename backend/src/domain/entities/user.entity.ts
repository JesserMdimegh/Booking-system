import { UserRole } from '../enums/user-role.enum';

export abstract class User {
  id: string;
  keycloakUserId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, keycloakUserId: string, email: string, name: string) {
    this.id = id;
    this.keycloakUserId = keycloakUserId;
    this.email = email;
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
