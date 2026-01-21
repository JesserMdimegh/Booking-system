import { Injectable, Inject } from '@nestjs/common';
import { Slot } from '../../../domain/entities/slot.entity';
import type { ISlotRepository } from '../../../domain/repositories/slot.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';

import { CreateSlotDto } from '../../dto/create-slot.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateSlotUseCase {
  constructor(
    @Inject(SLOT_REPOSITORY) private slotRepository: ISlotRepository,
  ) {}

  async execute(input: CreateSlotDto): Promise<Slot> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    const hasOverlap = await this.slotRepository.checkOverlap(
      input.providerId,
      startTime,
      endTime,
    );

    if (hasOverlap) {
      throw new Error('Slot overlaps with an existing slot');
    }

    const slot = new Slot(
      uuid(),
      input.providerId,
      new Date(input.date),
      startTime,
      endTime,
    );

    return this.slotRepository.create(slot);
  }
}
