import { FieldCryptoService } from './field-crypto.service'

process.env.FIELD_ENCRYPTION_DEV_KEY = 'unit-test-key'
delete process.env.NODE_ENV // force dev mode path in this suite

describe('FieldCryptoService', () => {
  it('round-trips plaintext through encrypt/decrypt', async () => {
    const svc = new FieldCryptoService()
    const secret = '2743 8951 2234'
    const blob = await svc.encrypt(secret)
    expect(blob.length).toBeGreaterThan(12 + 16)
    await expect(svc.decrypt(blob)).resolves.toBe(secret)
  })

  it('produces different ciphertexts per call (fresh nonce)', async () => {
    const svc = new FieldCryptoService()
    const a = await svc.encrypt('same-value')
    const b = await svc.encrypt('same-value')
    expect(Buffer.compare(a, b)).not.toBe(0)
  })

  it('rejects tampered ciphertext (GCM auth)', async () => {
    const svc = new FieldCryptoService()
    const blob = await svc.encrypt('sensitive')
    blob[blob.length - 1] ^= 0xff
    await expect(svc.decrypt(blob)).rejects.toThrow()
  })

  it('hashToken is deterministic and salted by pepper', () => {
    const h1 = FieldCryptoService.hashToken('123456')
    expect(FieldCryptoService.hashToken('123456')).toBe(h1)
    expect(FieldCryptoService.hashToken('123457')).not.toBe(h1)
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('password hash/verify round-trip and wrong-password rejection', () => {
    const stored = FieldCryptoService.hashPassword('correct-horse-battery')
    expect(FieldCryptoService.verifyPassword('correct-horse-battery', stored)).toBe(true)
    expect(FieldCryptoService.verifyPassword('wrong', stored)).toBe(false)
  })
})
