import { Slot } from '../entities/slot.entity';

export interface ISlotRepository {
  create(slot: Slot): Promise<Slot>;
  findById(id: string): Promise<Slot | null>;
  findByProviderId(providerId: string): Promise<Slot[]>;
  findByProviderIdAndDate(providerId: string, date: Date): Promise<Slot[]>;
  update(slot: Slot): Promise<Slot>;
  delete(id: string): Promise<void>;
  checkOverlap(providerId: string, startTime: Date, endTime: Date): Promise<boolean>;
}

export const SLOT_REPOSITORY = 'SLOT_REPOSITORY';
