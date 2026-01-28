import { IsEmail, IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateProviderDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
