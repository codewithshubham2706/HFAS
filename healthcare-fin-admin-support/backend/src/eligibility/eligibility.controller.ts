import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { EligibilityService, SchemeMatch } from './eligibility.service'

class OnboardingFacts {
  @IsOptional() @IsString() condition?: string
  @IsOptional() @IsEnum(['govt', 'private', 'trust']) facility_type?: 'govt' | 'private' | 'trust'
}

class ProfileFacts {
  @IsOptional() @IsNumber() annual_income_inr?: number
  @IsOptional() @IsNumber() household_size?: number
  @IsOptional() @IsString() has_insurer_policy?: boolean
}

export class AssessDto {
  @IsOptional() @IsObject() @ValidateNested() @Type(() => ProfileFacts)
  profile?: ProfileFacts

  @IsOptional() @IsObject() @ValidateNested() @Type(() => OnboardingFacts)
  onboarding?: OnboardingFacts
}

@ApiTags('eligibility')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibility: EligibilityService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Assess facts against all active schemes; returns score + why' })
  async assess(@Req() req: { user: RequestUser }, @Body() dto: AssessDto): Promise<SchemeMatch[]> {
    return this.eligibility.assess({ userId: req.user.sub, ...dto })
  }
}
