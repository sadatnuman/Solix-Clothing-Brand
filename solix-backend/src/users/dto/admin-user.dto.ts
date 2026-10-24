import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminUserStatusDto {
  @IsBoolean() isActive: boolean;
}
export class AdminResetPasswordDto {
  @IsString() @MinLength(8) @MaxLength(72) temporaryPassword: string;
  @IsOptional() @IsBoolean() mustChangePassword?: boolean;
}
