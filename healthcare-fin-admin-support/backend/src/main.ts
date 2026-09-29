import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })
  const logger = new Logger('Bootstrap')

  // Security headers. In prod CSPReportOnly should be flipped off once the
  // CSP is proven (see docs/ComplianceReport.md § Security checklist).
  app.use(helmet())
  app.use(
    helmet.contentSecurityPolicy({
      reportOnly: process.env.CSP_REPORT_ONLY === 'true',
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Next.js injects styles
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'],
        frameAncestors: ["'none'"],
      },
    }),
  )

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api')
  setupSwagger(app)

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port)
  logger.log(`HFAS API listening on :${port} (docs at /docs)`)
}

void bootstrap()
