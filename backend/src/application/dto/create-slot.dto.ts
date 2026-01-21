import { IsDate, IsString, IsDateString } from 'class-validator';

export class CreateSlotDto {
  @IsString()
  providerId: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
