import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Provider } from 'src/domain/entities/Provider.entity';
import { IProviderRepository } from 'src/domain/repositories/provider.repository';

@Injectable()
export class PrismaProviderRepository implements IProviderRepository {
  constructor(private prisma: PrismaService) {}

  async create(provider: Provider): Promise<Provider> {
    const created = await this.prisma.user.create({
      data: {
        id: provider.id,
        email: provider.email,
        name: provider.name,
        role: provider.role,
        services: provider.services,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Provider | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });
    return record && record.role === 'PROVIDER'
      ? this.toDomain(record)
      : null;
  }

  async findByEmail(email: string): Promise<Provider | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
    });
    return record && record.role === 'PROVIDER'
      ? this.toDomain(record)
      : null;
  }

  async findAll(): Promise<Provider[]> {
    const records = await this.prisma.user.findMany({
      where: { role: 'PROVIDER' },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByService(service: string): Promise<Provider[]> {
    const records = await this.prisma.user.findMany({
      where: {
        role: 'PROVIDER',
        services: {
          has: service,
        },
      },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(provider: Provider): Promise<Provider> {
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        name: provider.name,
        services: provider.services,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Provider {
    const provider = new Provider(
      record.id,
      record.email,
      record.name,
      record.services || [],
    );
    provider.createdAt = new Date(record.createdAt);
    provider.updatedAt = new Date(record.updatedAt);
    return provider;
  }
}
