import { Injectable } from '@nestjs/common'
import { DbService } from '../db/db.service'
import { assessScheme, Rule, Assessment } from './engine'

export type SchemeMatch = {
  schemeId: string
  slug: string
  name: string
  providerType: string
  maxAmountInr: string | null
  assessment: Assessment
}

export type AssessFacts = {
  userId?: string
  profile?: {
    annual_income_inr?: number
    household_size?: number
    has_insurer_policy?: boolean
  }
  onboarding?: {
    condition?: string
    facility_type?: 'govt' | 'private' | 'trust'
  }
}

@Injectable()
export class EligibilityService {
  constructor(private readonly db: DbService) {}

  async assess(facts: AssessFacts): Promise<SchemeMatch[]> {
    const schemes = await this.db.query<{
      id: string; slug: string; name: string; provider_type: string
      max_amount_inr: string | null; eligibility_rules: Rule[]
    }>(
      `SELECT id, slug, name, provider_type, max_amount_inr, eligibility_rules
         FROM schemes WHERE active = true`,
    )

    const flatFacts = { ...facts.profile, ...facts.onboarding, userId: facts.userId }
    // Re-nest so paths like profile.x / onboarding.y resolve.
    const nested = {
      profile: facts.profile ?? {},
      onboarding: facts.onboarding ?? {},
    }

    return schemes.rows.map((s) => ({
      schemeId: s.id,
      slug: s.slug,
      name: s.name,
      providerType: s.provider_type,
      maxAmountInr: s.max_amount_inr,
      assessment: assessScheme(s.eligibility_rules ?? [], nested),
    }))
  }
}
