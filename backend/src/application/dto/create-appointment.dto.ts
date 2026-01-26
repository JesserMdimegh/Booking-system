import { IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  slotId: string;
}
