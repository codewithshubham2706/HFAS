import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, scryptSync } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'

/**
 * Field-level envelope encryption for sensitive columns
 * (profiles.national_id_enc, insurance_policy_number, etc.).
 *
 * Production: AWS KMS — GenerateDataKey gives (plaintext DEK, wrapped DEK);
 * store `wrappedDek` beside the ciphertext; decrypt via kms:Decrypt.
 * Local dev: deterministic key derived from FIELD_ENCRYPTION_DEV_KEY via HKDF
 * (never use in production — startup guard below).
 *
 * Wire format: base64(nonce[12] || wrappedDekLen[2] || wrappedDek || ciphertext+tag)
 */
@Injectable()
export class FieldCryptoService {
  private readonly logger = new Logger(FieldCryptoService.name)
  private cachedKey?: Buffer

  private async dataKey(): Promise<Buffer> {
    if (this.cachedKey) return this.cachedKey

    if (process.env.KMS_KEY_ARN && process.env.NODE_ENV === 'production') {
      // TODO(org): wire @aws-sdk/client-kms here.
      // const kms = new KMSClient({ region: process.env.KMS_REGION })
      // const { Plaintext } = await kms.send(new GenerateDataKeyCommand({
      //   KeyId: process.env.KMS_KEY_ARN, NumberOfBytes: 32 }))
      // this.cachedKey = Buffer.from(Plaintext!)
      throw new Error('KMS path not wired yet — see TODO(org) in field-crypto.service.ts')
    }

    const seed = process.env.FIELD_ENCRYPTION_DEV_KEY
    if (!seed) throw new Error('FIELD_ENCRYPTION_DEV_KEY missing for dev encryption')
    if (process.env.NODE_ENV === 'production') {
      // Hard stop: never run production PII on a static dev key.
      throw new Error('Refusing dev field-encryption key in production — configure KMS_KEY_ARN')
    }
    this.cachedKey = Buffer.from(hkdfSync('sha256', seed, 'hfas-field-salt', 'hfas-field-enc', 32))
    return this.cachedKey
  }

  async encrypt(plaintext: string): Promise<Buffer> {
    const key = await this.dataKey()
    const nonce = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, nonce)
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    return Buffer.concat([nonce, Buffer.from([0, 0]), enc, cipher.getAuthTag()])
  }

  async decrypt(blob: Buffer): Promise<string> {
    const key = await this.dataKey()
    const nonce = blob.subarray(0, 12)
    const tag = blob.subarray(blob.length - 16)
    const body = blob.subarray(14, blob.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', key, nonce)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')
  }

  /** HMAC-style compare helper for OTP/refresh token hashes (never store raw). */
  static hashToken(raw: string): string {
    const pepper = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-pepper'
    return createHash('sha256').update(`${raw}:${pepper}`).digest('hex')
  }

  /** Password hashing — scrypt with per-user salt (bcrypt also acceptable). */
  static hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `scrypt$${salt}$${hash}`
  }

  static verifyPassword(password: string, stored: string): boolean {
    const [scheme, salt, hash] = stored.split('$')
    if (scheme !== 'scrypt' || !salt || !hash) return false
    const candidate = scryptSync(password, salt, 64).toString('hex')
    return candidate.length === hash.length &&
      require('node:crypto').timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'))
  }
}
