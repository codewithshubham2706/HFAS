import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './db/db.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { SchemesModule } from './schemes/schemes.module'
import { EligibilityModule } from './eligibility/eligibility.module'
import { DocumentsModule } from './documents/documents.module'
import { ApplicationsModule } from './applications/applications.module'
import { NotificationsModule } from './notifications/notifications.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { DataRequestsModule } from './data-requests/data-requests.module'
import { FraudModule } from './fraud/fraud.module'
import { TelemetryModule } from './telemetry/telemetry.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [] }),
    DbModule,
    AuthModule,
    UsersModule,
    SchemesModule,
    EligibilityModule,
    DocumentsModule,
    ApplicationsModule,
    NotificationsModule,
    WebhooksModule,
    DataRequestsModule,
    FraudModule,
    TelemetryModule,
    AdminModule,
  ],
})
export class AppModule {}
