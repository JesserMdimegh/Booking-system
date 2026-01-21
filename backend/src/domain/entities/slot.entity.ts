import { SlotStatus } from '../enums/slot-status.enum';

export class Slot {
  id: string;
  providerId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    providerId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
  ) {
    this.id = id;
    this.providerId = providerId;
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = SlotStatus.AVAILABLE;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  book(): void {
    if (this.status === SlotStatus.BOOKED) {
      throw new Error('Slot is already booked');
    }
    this.status = SlotStatus.BOOKED;
  }

  release(): void {
    if (this.status === SlotStatus.AVAILABLE) {
      throw new Error('Slot is already available');
    }
    this.status = SlotStatus.AVAILABLE;
  }

  isAvailable(): boolean {
    return this.status === SlotStatus.AVAILABLE;
  }
}
