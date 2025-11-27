import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  type?: 'Bug Report' | 'Feature Request' | 'Support';
}
