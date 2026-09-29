import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RequestOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'E.164 phone OR email' })
  @IsString()
  @MinLength(6)
  @MaxLength(320)
  destination!: string

  @ApiProperty({ enum: ['sms', 'email'] })
  @IsEnum(['sms', 'email'])
  channel!: 'sms' | 'email'
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @MinLength(6)
  destination!: string

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  code!: string

  @ApiProperty({ enum: ['sms', 'email'] })
  @IsEnum(['sms', 'email'])
  channel!: 'sms' | 'email'
}

export class SignupDto {
  @ApiProperty({ required: false, example: 'sunita@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ required: false, example: '+919876543210' })
  @IsOptional()
  @Matches(/^\+\d{8,15}$/, { message: 'phone must be E.164' })
  phone?: string

  @ApiProperty({ minLength: 10, description: 'Password for email login (optional if OTP-only)' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  password?: string

  @ApiProperty({ enum: ['patient', 'caregiver'], default: 'patient' })
  @IsOptional()
  @IsEnum(['patient', 'caregiver'])
  role?: 'patient' | 'caregiver'

  @ApiProperty({ example: 'en-IN', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string
}

export class LoginDto {
  @ApiProperty({ example: 'sunita@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  password!: string
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string
}
