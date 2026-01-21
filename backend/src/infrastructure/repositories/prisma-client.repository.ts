import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Client } from 'src/domain/entities/client.entity';
import { IClientRepository } from 'src/domain/repositories/client.repository';

@Injectable()
export class PrismaClientRepository implements IClientRepository {
  constructor(private prisma: PrismaService) {}

  async create(client: Client): Promise<Client> {
    const created = await this.prisma.user.create({
      data: {
        id: client.id,
        email: client.email,
        name: client.name,
        role: client.role,
        phoneNumber: client.phoneNumber,
        address: client.address,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Client | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { appointments: true },
    });
    return record && record.role === 'CLIENT'
      ? this.toDomain(record)
      : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { appointments: true },
    });
    return record && record.role === 'CLIENT'
      ? this.toDomain(record)
      : null;
  }

  async findAll(): Promise<Client[]> {
    const records = await this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: { appointments: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(client: Client): Promise<Client> {
    const updated = await this.prisma.user.update({
      where: { id: client.id },
      data: {
        name: client.name,
        phoneNumber: client.phoneNumber,
        address: client.address,
        updatedAt: new Date(),
      },
      include: { appointments: true },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Client {
    const client = new Client(
      record.id,
      record.email,
      record.name,
      record.phoneNumber,
      record.address,
    );
    client.createdAt = new Date(record.createdAt);
    client.updatedAt = new Date(record.updatedAt);
    return client;
  }
}