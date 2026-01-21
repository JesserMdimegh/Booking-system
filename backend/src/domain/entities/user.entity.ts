import { UserRole } from '../enums/user-role.enum';

export abstract class User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, email: string, name: string, role: UserRole) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
