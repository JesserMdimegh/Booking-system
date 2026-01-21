import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { Slot } from '../../../domain/entities/slot.entity';

@Injectable()
export class GetSlotsUseCase {
  constructor(
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async executeByProviderId(providerId: string): Promise<Slot[]> {
    return this.slotRepository.findByProviderId(providerId);
  }

  async executeByProviderAndDate(providerId: string, date: Date): Promise<Slot[]> {
    return this.slotRepository.findByProviderIdAndDate(providerId, date);
  }

  async executeById(id: string): Promise<Slot> {
    const slot = await this.slotRepository.findById(id);
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    return slot;
  }

  async executeAvailableByProvider(providerId: string): Promise<Slot[]> {
    const slots = await this.slotRepository.findByProviderId(providerId);
    return slots.filter(slot => slot.isAvailable());
  }

  async executeAvailableByProviderAndDate(providerId: string, date: Date): Promise<Slot[]> {
    const slots = await this.slotRepository.findByProviderIdAndDate(providerId, date);
    return slots.filter(slot => slot.isAvailable());
  }

  async updateSlot(id: string, data: any): Promise<Slot> {
    const slot = await this.slotRepository.findById(id);
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    
    // Update slot properties based on data
    if (data.date) slot.date = new Date(data.date);
    if (data.startTime) slot.startTime = new Date(data.startTime);
    if (data.endTime) slot.endTime = new Date(data.endTime);
    if (data.status) slot.status = data.status;
    
    return await this.slotRepository.update(slot);
  }

  async deleteSlot(id: string): Promise<void> {
    const slot = await this.slotRepository.findById(id);
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    await this.slotRepository.delete(id);
  }
}
