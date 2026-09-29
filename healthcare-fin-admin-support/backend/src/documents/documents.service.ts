import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DbService } from '../db/db.service'
import { AuditService } from '../common/audit/audit.service'
import { StorageService } from './storage.service'
import { ocrAdapterFactory } from '../ocr/ocr.adapter'
import { RequestUser } from '../common/guards/jwt-auth.guard'

const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])

export type CreateUploadDto = {
  doc_type: string
  content_type: string
  byte_size: number
  original_name?: string
}

@Injectable()
export class DocumentsService {
  private readonly ocr = ocrAdapterFactory()

  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Step 1 of upload: register intent, return presigned PUT URL. */
  async createUpload(actor: RequestUser, userId: string, dto: CreateUploadDto) {
    this.assertOwner(actor, userId)
    this.storage.assertConfigured()

    if (!ALLOWED_TYPES.has(dto.content_type)) {
      throw new BadRequestException(`content_type must be one of ${[...ALLOWED_TYPES].join(', ')}`)
    }
    if (dto.byte_size <= 0 || dto.byte_size > MAX_BYTES) {
      throw new BadRequestException('byte_size must be between 1 and 26,214,400 (25 MB)')
    }

    const id = randomUUID()
    const ext = dto.content_type === 'application/pdf' ? 'pdf' : dto.content_type.split('/')[1]
    const key = `u/${userId}/${id}.${ext}`

    await this.db.query(
      `INSERT INTO documents (id, user_id, doc_type, status, storage_key, content_type, byte_size, original_name)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)`,
      [id, userId, dto.doc_type, key, dto.content_type, dto.byte_size, dto.original_name ?? null],
    )

    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'document.upload_url.issued',
      entity: 'document', entityId: id, metadata: { doc_type: dto.doc_type, byte_size: dto.byte_size },
    })

    return {
      documentId: id,
      uploadUrl: this.storage.presign('PUT', key, Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900)),
      method: 'PUT',
      headers: { 'Content-Type': dto.content_type },
      expiresIn: Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900),
    }
  }

  /** Step 2: client confirms the PUT completed; checksum recorded. */
  async confirmUpload(actor: RequestUser, documentId: string, checksumSha256: string) {
    const doc = await this.getOwned(actor, documentId)
    if (!/^[a-f0-9]{64}$/i.test(checksumSha256)) {
      throw new BadRequestException('checksum_sha256 must be a hex sha256 digest')
    }
    await this.db.query(
      `UPDATE documents SET status = 'uploaded', checksum_sha256 = $2 WHERE id = $1`,
      [documentId, checksumSha256.toLowerCase()],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'document.uploaded',
      entity: 'document', entityId: documentId,
    })
    return { id: doc.id, status: 'uploaded' as const }
  }

  /** Step 3: run OCR (sync in dev; move to a queue worker for production). */
  async processOcr(actor: RequestUser, documentId: string) {
    const doc = await this.getOwned(actor, documentId)
    if (doc.status !== 'uploaded' && doc.status !== 'failed' && doc.status !== 'flagged') {
      throw new BadRequestException(`document status '${doc.status}' is not processable`)
    }

    await this.db.query(`UPDATE documents SET status = 'processing', ocr_provider = $2 WHERE id = $1`,
      [documentId, this.ocr.provider])

    try {
      // In production this job runs on a worker: fetch object bytes from S3
      // server-side (never hand the presigned GET to third parties).
      const buffer = Buffer.alloc(0) // TODO(org): storage.getObject(doc.storage_key)
      const result = await this.ocr.process(buffer, doc.content_type, doc.doc_type)

      await this.db.query(
        `UPDATE documents
            SET status = $2, ocr_text = $3, ocr_fields = $4::jsonb, ocr_error = NULL
          WHERE id = $1`,
        [documentId, result.fields.length ? 'parsed' : 'flagged',
         result.text, JSON.stringify(result.fields)],
      )
      await this.audit.record({
        actorId: actor.sub, actorRole: actor.role, action: 'document.ocr.completed',
        entity: 'document', entityId: documentId,
        metadata: { provider: result.provider, field_count: result.fields.length },
      })
      return { id: documentId, status: result.fields.length ? 'parsed' : 'flagged', fields: result.fields }
    } catch (err) {
      await this.db.query(
        `UPDATE documents SET status = 'failed', ocr_error = $2 WHERE id = $1`,
        [documentId, String(err).slice(0, 500)],
      )
      throw err
    }
  }

  /** Extracted fields consumed by the application prefill step. */
  async getExtractedFields(actor: RequestUser, documentId: string) {
    const doc = await this.getOwned(actor, documentId)
    return { id: doc.id, doc_type: doc.doc_type, fields: doc.ocr_fields ?? [] }
  }

  async listForUser(actor: RequestUser, userId: string) {
    this.assertOwnerOrCaseworker(actor, userId)
    const rows = await this.db.query(
      `SELECT id, doc_type, status, content_type, byte_size, original_name, created_at
         FROM documents WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [userId],
    )
    return rows.rows
  }

  /** Soft delete; object purge is done by the deletion-executor job. */
  async softDelete(actor: RequestUser, documentId: string) {
    const doc = await this.getOwned(actor, documentId)
    await this.db.query(
      `UPDATE documents SET status = 'deleted', deleted_at = now(), ocr_text = NULL, ocr_fields = NULL WHERE id = $1`,
      [documentId],
    )
    await this.audit.record({
      actorId: actor.sub, actorRole: actor.role, action: 'document.deleted',
      entity: 'document', entityId: documentId,
    })
    return { id: doc.id, status: 'deleted' as const }
  }

  // ── helpers ──────────────────────────────────────────────────
  private assertOwner(actor: RequestUser, userId: string): void {
    if (actor.sub !== userId) throw new ForbiddenException('not the document owner')
  }

  private assertOwnerOrCaseworker(actor: RequestUser, userId: string): void {
    if (actor.sub === userId || actor.role === 'caseworker' || actor.role === 'admin') return
    throw new ForbiddenException('insufficient role')
  }

  private async getOwned(actor: RequestUser, documentId: string) {
    const rows = await this.db.query<{
      id: string; user_id: string; status: string; content_type: string
      doc_type: string; storage_key: string; ocr_fields: unknown
    }>(`SELECT id, user_id, status, content_type, doc_type, storage_key, ocr_fields FROM documents WHERE id = $1`, [documentId])
    const doc = rows.rows[0]
    if (!doc || doc.status === 'deleted') throw new NotFoundException('document not found')
    this.assertOwnerOrCaseworker(actor, doc.user_id)
    return doc
  }
}
