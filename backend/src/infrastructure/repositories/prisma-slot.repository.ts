import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Slot } from 'src/domain/entities/slot.entity';
import { ISlotRepository } from 'src/domain/repositories/slot.repository';

@Injectable()
export class PrismaSlotRepository implements ISlotRepository {
  constructor(private prisma: PrismaService) {}

  async create(slot: Slot): Promise<Slot> {
    const created = await this.prisma.slot.create({
      data: {
        id: slot.id,
        providerId: slot.providerId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Slot | null> {
    const record = await this.prisma.slot.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByProviderId(providerId: string): Promise<Slot[]> {
    const records = await this.prisma.slot.findMany({
      where: { providerId },
      orderBy: { date: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByProviderIdAndDate(providerId: string, date: Date): Promise<Slot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.prisma.slot.findMany({
      where: {
        providerId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });
    
    return records.map((r) => this.toDomain(r));
  }

  async update(slot: Slot): Promise<Slot> {
    const updated = await this.prisma.slot.update({
      where: { id: slot.id },
      data: {
        status: slot.status,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.slot.delete({
      where: { id },
    });
  }

  async checkOverlap(
    providerId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const overlap = await this.prisma.slot.findFirst({
      where: {
        providerId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
    return !!overlap;
  }

  private toDomain(record: any): Slot {
    const slot = new Slot(
      record.id,
      record.providerId,
      new Date(record.date),
      new Date(record.startTime),
      new Date(record.endTime),
    );
    slot.status = record.status;
    slot.createdAt = new Date(record.createdAt);
    slot.updatedAt = new Date(record.updatedAt);
    return slot;
  }
}