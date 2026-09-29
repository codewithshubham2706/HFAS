import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../db/db.service'

@Injectable()
export class SchemesService {
  constructor(private readonly db: DbService) {}

  async list(opts: { q?: string; providerType?: string; limit?: number; offset?: number }) {
    const limit = Math.min(opts.limit ?? 50, 100)
    const offset = opts.offset ?? 0
    const params: unknown[] = []
    const where: string[] = ['active = true']

    if (opts.providerType) {
      params.push(opts.providerType)
      where.push(`provider_type = $${params.length}`)
    }
    if (opts.q) {
      params.push(opts.q)
      where.push(
        `to_tsvector('english', name || ' ' || provider_name || ' ' || description) @@ plainto_tsquery('english', $${params.length})`,
      )
    }

    const rows = await this.db.query(
      `SELECT id, slug, name, provider_type, provider_name, description,
              max_amount_inr, required_docs, helpline
         FROM schemes
        WHERE ${where.join(' AND ')}
        ORDER BY max_amount_inr DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}`,
      params,
    )
    return rows.rows
  }

  async bySlug(slug: string) {
    const rows = await this.db.query(
      `SELECT id, slug, name, provider_type, provider_name, description,
              max_amount_inr, eligibility_rules, required_docs, helpline
         FROM schemes WHERE slug = $1 AND active = true`,
      [slug],
    )
    if (!rows.rows.length) throw new NotFoundException('scheme not found')
    return rows.rows[0]
  }
}
