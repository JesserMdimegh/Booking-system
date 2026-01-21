import { Injectable, Inject } from '@nestjs/common';
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
}
