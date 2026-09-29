import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AuditExportController } from './audit-export.controller'

@Module({
  controllers: [AdminController, AuditExportController],
})
export class AdminModule {}
