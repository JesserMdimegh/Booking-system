import { IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  clientId: string;

  @IsString()
  slotId: string;
}
