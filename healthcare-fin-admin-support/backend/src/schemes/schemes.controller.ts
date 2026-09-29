import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { SchemesService } from './schemes.service'

@ApiTags('schemes')
@Controller('schemes')
export class SchemesController {
  constructor(private readonly schemes: SchemesService) {}

  @Get()
  @ApiOperation({ summary: 'Public scheme catalog with optional search + provider filter' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'providerType', required: false, enum: ['govt', 'insurer', 'trust'] })
  async list(
    @Query('q') q?: string,
    @Query('providerType') providerType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.schemes.list({
      q, providerType,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    })
  }
}
