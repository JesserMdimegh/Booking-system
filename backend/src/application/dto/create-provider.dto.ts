import { IsEmail, IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateProviderDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}
