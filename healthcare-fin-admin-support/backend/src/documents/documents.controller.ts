import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator'
import { JwtAuthGuard, RequestUser } from '../common/guards/jwt-auth.guard'
import { DocumentsService, CreateUploadDto } from './documents.service'

class CreateUploadBody implements CreateUploadDto {
  @IsString() @MinLength(2) doc_type!: string          // 'aadhaar' | 'hospital_invoice' | …
  @IsString() content_type!: string                    // 'application/pdf' | 'image/png' | …
  @IsNumber() @Min(1) @Max(26_214_400) byte_size!: number
  @IsOptional() @IsString() original_name?: string
}

class ConfirmUploadBody {
  @IsString() @Matches(/^[a-f0-9]{64}$/i) checksum_sha256!: string
}

@ApiTags('documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Step 1 — register upload intent; returns presigned PUT URL' })
  async createUpload(@Req() req: { user: RequestUser }, @Body() dto: CreateUploadBody) {
    return this.documents.createUpload(req.user, req.user.sub, dto)
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Step 2 — confirm PUT completed; record checksum' })
  async confirm(@Req() req: { user: RequestUser }, @Param('id') id: string, @Body() dto: ConfirmUploadBody) {
    return this.documents.confirmUpload(req.user, id, dto.checksum_sha256)
  }

  @Post(':id/process-ocr')
  @ApiOperation({ summary: 'Step 3 — run OCR pipeline; fields become available for prefill' })
  async processOcr(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.documents.processOcr(req.user, id)
  }

  @Get(':id/fields')
  @ApiOperation({ summary: 'Extracted fields (for application prefill)' })
  async fields(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.documents.getExtractedFields(req.user, id)
  }

  @Get('mine')
  @ApiOperation({ summary: 'List caller’s documents' })
  async mine(@Req() req: { user: RequestUser }) {
    return this.documents.listForUser(req.user, req.user.sub)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete; objects purged by retention job' })
  async remove(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.documents.softDelete(req.user, id)
  }
}
