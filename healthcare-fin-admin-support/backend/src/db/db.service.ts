import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

/**
 * Minimal SQL-first data access (no ORM). Each service owns its SQL.
 * Rationale: auditability of every PII-touching query; easy EXPLAIN reviews.
 */
@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL })

  query<T extends QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params)
  }

  /** Run a set of statements in one transaction; rolls back on throw. */
  async tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const out = await fn(client)
      await client.query('COMMIT')
      return out
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }
}
