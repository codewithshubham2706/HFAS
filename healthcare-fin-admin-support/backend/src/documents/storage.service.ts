import { createHash, createHmac } from 'node:crypto'
import { Injectable, InternalServerErrorException } from '@nestjs/common'

/**
 * Minimal SigV4 presigner for S3-compatible storage (AWS S3 / MinIO).
 * Deliberately dependency-free: only aws4 signing of PUT/GET object URLs.
 * TODO(org): swap for @aws-sdk/client-s3 + s3-presigner if you need
 * multipart uploads or KMS-keyed objects (recommended in production).
 */
@Injectable()
export class StorageService {
  private endpoint(): URL {
    return new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000')
  }

  private bucket(): string {
    return process.env.S3_BUCKET ?? 'hfas-documents'
  }

  private hmac(key: Buffer | string, data: string): Buffer {
    return createHmac('sha256', key).update(data, 'utf8').digest()
  }

  private signKey(dateStamp: string, region: string, service: string): Buffer {
    const kDate = this.hmac(`AWS4${process.env.S3_SECRET_ACCESS_KEY ?? ''}`, dateStamp)
    const kRegion = this.hmac(kDate, region)
    const kService = this.hmac(kRegion, service)
    return this.hmac(kService, 'aws4_request')
  }

  presign(method: 'PUT' | 'GET', key: string, ttlSeconds = 900): string {
    const url = this.endpoint()
    const region = process.env.S3_REGION ?? 'ap-south-1'
    const accessKey = process.env.S3_ACCESS_KEY_ID ?? ''
    const service = 's3'
    const now = new Date()
    const amzDate = `${now.toISOString().replace(/[:-]|\.\d{3}/g, '')}`       // 20260101T000000Z
    const dateStamp = amzDate.slice(0, 8)

    const canonicalUri = `/${this.bucket()}/${key.split('/').map(encodeURIComponent).join('/')}`
    const host = url.host
    const payloadHash = 'UNSIGNED-PAYLOAD'

    const query: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${accessKey}/${dateStamp}/${region}/${service}/aws4_request`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(ttlSeconds),
      'X-Amz-SignedHeaders': 'host',
    }
    const canonicalQuery = Object.keys(query).sort().map((k) =>
      `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&')

    const canonicalRequest = [
      method, canonicalUri, canonicalQuery,
      `host:${host}\n`, 'host', payloadHash,
    ].join('\n')

    const scope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256', amzDate, scope,
      createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
    ].join('\n')

    const signature = createHmac('sha256', this.signKey(dateStamp, region, service))
      .update(stringToSign, 'utf8').digest('hex')

    return `${url.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
  }

  assertConfigured(): void {
    if (!process.env.S3_SECRET_ACCESS_KEY) {
      throw new InternalServerErrorException('object storage not configured')
    }
  }
}
