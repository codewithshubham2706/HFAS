import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

/** Swagger UI at /docs; the full static contract also lives at openapi/openapi.yaml. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('HFAS API')
    .setDescription(
      'Healthcare Financial & Administrative Support — auth (OTP+JWT), eligibility, ' +
      'documents (signed upload + OCR), applications, admin queue, data requests, webhooks. ' +
      'Draft contract **REQUIRES LEGAL REVIEW** for data-handling clauses reflected in payloads.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth', 'Signup, OTP verification, login, refresh')
    .addTag('schemes', 'Public scheme catalog')
    .addTag('eligibility', 'Rule-engine assessment')
    .addTag('documents', 'Signed-URL upload + OCR pipeline')
    .addTag('applications', 'Lifecycle: draft → consent → submit → decision')
    .addTag('notifications', 'User notifications (timeline)')
    .addTag('webhooks', 'Inbound integration callbacks (HMAC-verified)')
    .addTag('data-requests', 'GDPR/DPDP access, correction, deletion')
    .addTag('admin', 'Caseworker queue + assignments')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
}
