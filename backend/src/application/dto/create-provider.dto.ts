import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateProviderDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}
