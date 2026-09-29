import { Injectable, Logger } from '@nestjs/common'
import { DbService } from '../db/db.service'

/**
 * Notifications outbox. Rows are inserted by domain events (application
 * submitted, decision made, docs requested); a sweep job sends queued items
 * through the configured provider stubs.
 * TODO(org): wire Twilio (SMS) / SendGrid (email) SDKs; register DLT
 * templates for India before production SMS.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private readonly db: DbService) {}

  async enqueue(userId: string, channel: 'email' | 'sms' | 'push' | 'inapp', template: string, payload: Record<string, unknown>): Promise<void> {
    await this.db.query(
      `INSERT INTO notifications (user_id, channel, template, payload) VALUES ($1, $2, $3, $4::jsonb)`,
      [userId, channel, template, JSON.stringify(payload)],
    )
  }

  async sweep(): Promise<{ sent: number }> {
    const queued = await this.db.query<{ id: string; user_id: string; channel: string; template: string; payload: Record<string, unknown> }>(
      `SELECT id, user_id, channel, template, payload FROM notifications
        WHERE status = 'queued' ORDER BY created_at ASC LIMIT 50`,
    )
    let sent = 0
    for (const n of queued.rows) {
      try {
        if (n.channel === 'email') await this.sendEmail(n.user_id, n.template, n.payload)
        if (n.channel === 'sms') await this.sendSms(n.user_id, n.template, n.payload)
        await this.db.query(`UPDATE notifications SET status = 'sent', sent_at = now() WHERE id = $1`, [n.id])
        sent++
      } catch (err) {
        await this.db.query(`UPDATE notifications SET status = 'failed', error = $2 WHERE id = $1`,
          [n.id, String(err).slice(0, 300)])
      }
    }
    return { sent }
  }

  private async sendEmail(userId: string, template: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.log(`[stub email] user=${userId} template=${template} ${JSON.stringify(payload)}`)
    if (process.env.EMAIL_PROVIDER !== 'stub' && !process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid key missing') // fail loudly once real sending is enabled
    }
  }

  private async sendSms(userId: string, template: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.log(`[stub sms] user=${userId} template=${template} ${JSON.stringify(payload)}`)
    if (process.env.SMS_PROVIDER !== 'stub' && !process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('Twilio creds missing')
    }
  }
}
