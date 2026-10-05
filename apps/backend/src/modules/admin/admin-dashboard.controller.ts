import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles, ApiScope, ApiOkData } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardOverviewQueryDto, DashboardTimeSeriesQueryDto } from './dto/dashboard-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('admin - dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  // Tổng quan hệ thống: người dùng, thông báo, cấu hình
  @Get('summary')
  @ApiOperation({ summary: 'Get system summary statistics' })
  @ApiOkData(DashboardSummaryDto)
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  async getSummary(): Promise<BaseResponseDto<DashboardSummaryDto>> {
    const result = await this.service.getSummary();
    return BaseResponseDto.success('Get dashboard summary successfully', result);
  }

  // System overview
  @Get('overview')
  @ApiOperation({ summary: 'Get system overview dashboard' })
  @ApiResponse({ status: 200, description: 'Get dashboard overview successfully' })
  async getOverview(@Query() query: DashboardOverviewQueryDto): Promise<BaseResponseDto<any>> {
    const result = await this.service.getOverview(query);
    return BaseResponseDto.success('Get dashboard overview successfully', result);
  }

  // New users over time
  @Get('users')
  @ApiOperation({ summary: 'Get user growth statistics by time period' })
  @ApiResponse({ status: 200, description: 'Get user statistics successfully' })
  async getUserStats(@Query() query: DashboardTimeSeriesQueryDto): Promise<BaseResponseDto<any>> {
    const result = await this.service.getUserStats(query);
    return BaseResponseDto.success('Get user statistics successfully', result);
  }
}
