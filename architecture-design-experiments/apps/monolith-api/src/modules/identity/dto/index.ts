import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  tokenId: string;

  @ApiProperty()
  @IsString()
  token: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  tokenId: string;
}

export class PasswordResetRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
