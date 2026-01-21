import { IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsString()
  newSlotId: string;
}
