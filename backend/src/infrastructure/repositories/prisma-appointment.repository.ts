import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { Appointment } from 'src/domain/entities/appointment.entity';
import { IAppointmentRepository } from 'src/domain/repositories/appointment.repository';

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private prisma: PrismaService) {}

  async create(appointment: Appointment): Promise<Appointment> {
    const created = await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        clientId: appointment.clientId,
        slotId: appointment.slotId,
        status: appointment.status,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Appointment | null> {
    const record = await this.prisma.appointment.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { clientId },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByProviderId(providerId: string): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        slot: {
          providerId: providerId
        }
      },
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findBySlotId(slotId: string): Promise<Appointment | null> {
    const record = await this.prisma.appointment.findUnique({
      where: { slotId },
    });
    return record ? this.toDomain(record) : null;
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: appointment.status,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Appointment {
    const appointment = new Appointment(
      record.id,
      record.clientId,
      record.slotId,
    );
    appointment.status = record.status;
    appointment.createdAt = new Date(record.createdAt);
    appointment.updatedAt = new Date(record.updatedAt);
    
    // Attach slot data if available
    if (record.slot) {
      (appointment as any).slot = {
        id: record.slot.id,
        providerId: record.slot.providerId,
        date: record.slot.date,
        startTime: record.slot.startTime,
        endTime: record.slot.endTime,
        status: record.slot.status,
        createdAt: record.slot.createdAt,
        updatedAt: record.slot.updatedAt
      };
    }
    
    return appointment;
  }
  async getAll(): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }
}
