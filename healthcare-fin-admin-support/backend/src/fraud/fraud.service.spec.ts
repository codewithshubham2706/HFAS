import { FraudService } from './fraud.service'
import { DbService } from '../db/db.service'

describe('FraudService', () => {
  let db: { query: jest.Mock }
  let svc: FraudService

  beforeEach(() => {
    db = { query: jest.fn() }
    svc = new FraudService(db as unknown as DbService)
  })

  it('raises high-severity duplicate_checksum when another doc shares the hash', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'd1', user_id: 'u1', checksum_sha256: 'abc' }] }) // self lookup
      .mockResolvedValueOnce({ rows: [{ id: 'd2', user_id: 'u2', application_id: 'a2' }] })   // matches
      .mockResolvedValue({ rows: [] })                                                        // persist inserts

    const flags = await svc.checkDocument('d1')
    expect(flags).toHaveLength(1)
    expect(flags[0].kind).toBe('duplicate_checksum')
    expect(flags[0].severity).toBe('high')
    expect(flags[0].detail.same_owner).toBe(false)
  })

  it('no flags when checksum is unique', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'd1', user_id: 'u1', checksum_sha256: 'abc' }] })
      .mockResolvedValueOnce({ rows: [] })

    expect(await svc.checkDocument('d1')).toHaveLength(0)
  })

  it('no flags when doc has no checksum yet', async () => {
    db.query.mockResolvedValueOnce({ rows: [] })
    expect(await svc.checkDocument('d1')).toHaveLength(0)
  })

  it('amount outlier suppressed until 20+ samples', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ avg: '100000', stddev: '10000', n: '5' }] })
    expect(await svc.checkAmount('a1', 900000)).toBeNull()
  })

  it('amount outlier flagged at z > 3', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ avg: '100000', stddev: '10000', n: '50' }] })
    const flag = await svc.checkAmount('a1', 200000) // z = 10
    expect(flag).not.toBeNull()
    expect(flag?.kind).toBe('amount_outlier')
    expect(flag?.severity).toBe('medium')
  })

  it('normal amount not flagged', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ avg: '100000', stddev: '10000', n: '50' }] })
    expect(await svc.checkAmount('a1', 110000)).toBeNull()
  })
})
