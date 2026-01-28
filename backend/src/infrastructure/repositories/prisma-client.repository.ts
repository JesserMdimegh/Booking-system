import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Client } from 'src/domain/entities/client.entity';
import { IClientRepository } from 'src/domain/repositories/client.repository';

@Injectable()
export class PrismaClientRepository implements IClientRepository {
  constructor(private prisma: PrismaService) {}

  async create(client: Client): Promise<Client> {
    const created = await this.prisma.client.create({
      data: {
        id: client.id,
        keycloakUserId: client.keycloakUserId,
        email: client.email,
        name: client.name,
        phoneNumber: client.phoneNumber || null,
        address: client.address || null,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({
      where: { id },
      include: { appointments: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({
      where: { email },
      include: { appointments: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByKeycloakUserId(keycloakUserId: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({
      where: { keycloakUserId },
      include: { appointments: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Client[]> {
    const records = await this.prisma.client.findMany({
      include: { appointments: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByProvider(providerId: string): Promise<Client[]> {
    const records = await this.prisma.client.findMany({
      where: { 
        appointments: {
          some: {
            slot: {
              providerId: providerId
            }
          }
        }
      },
      include: { appointments: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(client: Client): Promise<Client> {
    const updated = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        name: client.name,
        phoneNumber: client.phoneNumber || null,
        address: client.address || null,
        updatedAt: new Date(),
      },
      include: { appointments: true },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Client {
    const client = new Client(
      record.id,
      record.keycloakUserId,
      record.email,
      record.name,
      record.phoneNumber || undefined,
      record.address || undefined,
    );
    client.createdAt = new Date(record.createdAt);
    client.updatedAt = new Date(record.updatedAt);
    return client;
  }
}