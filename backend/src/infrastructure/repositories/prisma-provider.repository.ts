import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Provider } from 'src/domain/entities/Provider.entity';
import { IProviderRepository } from 'src/domain/repositories/provider.repository';

@Injectable()
export class PrismaProviderRepository implements IProviderRepository {
  constructor(private prisma: PrismaService) {}

  async create(provider: Provider): Promise<Provider> {
    const created = await this.prisma.provider.create({
      data: {
        id: provider.id,
        keycloakUserId: provider.keycloakUserId,
        email: provider.email,
        name: provider.name,
        services: provider.services,
        phoneNumber: provider.phoneNumber || null,
        address: provider.address || null,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Provider | null> {
    const record = await this.prisma.provider.findUnique({
      where: { id },
      include: { slots: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Provider | null> {
    const record = await this.prisma.provider.findUnique({
      where: { email },
      include: { slots: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByKeycloakUserId(keycloakUserId: string): Promise<Provider | null> {
    const record = await this.prisma.provider.findUnique({
      where: { keycloakUserId },
      include: { slots: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Provider[]> {
    const records = await this.prisma.provider.findMany({
      include: { slots: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByService(service: string): Promise<Provider[]> {
    const records = await this.prisma.provider.findMany({
      where: {
        services: {
          has: service,
        },
      },
      include: { slots: true },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(provider: Provider): Promise<Provider> {
    const updated = await this.prisma.provider.update({
      where: { id: provider.id },
      data: {
        name: provider.name,
        services: provider.services,
        phoneNumber: provider.phoneNumber || null,
        address: provider.address || null,
        updatedAt: new Date(),
      },
      include: { slots: true },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.provider.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Provider {
    const provider = new Provider(
      record.id,
      record.keycloakUserId,
      record.email,
      record.name,
      record.services || [],
    );
    provider.createdAt = new Date(record.createdAt);
    provider.updatedAt = new Date(record.updatedAt);
    return provider;
  }
}
