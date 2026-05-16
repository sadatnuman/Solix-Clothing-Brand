import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsString()
  html?: string;
}
