import { Body, Controller, HttpCode, Ip, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto, RefreshDto, RequestOtpDto, SignupDto, VerifyOtpDto } from './dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a 6-digit OTP to phone (SMS) or email' })
  async requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.auth.requestOtp(dto, ip)
  }

  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP and receive JWT pair' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.auth.verifyOtp(dto, ip)
  }

  @Post('signup')
  @HttpCode(201)
  @ApiOperation({ summary: 'Email/phone + password signup' })
  async signup(@Body() dto: SignupDto, @Ip() ip: string) {
    return this.auth.signup(dto, ip)
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Email + password login' })
  async login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto.email, dto.password, ip)
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token, get new access token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken)
  }
}
