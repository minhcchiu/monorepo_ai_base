import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InfrastructureService } from './infrastructure.service';

@ApiTags('Infrastructure')
@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get global infrastructure KPI metrics and telemetry dashboard data' })
  getOverview() {
    return this.infrastructureService.getOverview();
  }
}
