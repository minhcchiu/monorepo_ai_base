import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiLogService } from './api-log.service';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard, RoleGuard } from '../../common/guards';
import { ApiScope, Roles } from '../../common/decorators';
import { ApiLogListResponseDto, QueryApiLogDto } from './dto';

@Controller('logs/api')
@ApiTags('API Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
export class ApiLogController {
  constructor(private readonly apiLogService: ApiLogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get API request logs with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'method', required: false, example: 'POST' })
  @ApiQuery({ name: 'path', required: false, example: '/api/v1/subscription/webhook/google' })
  @ApiQuery({ name: 'statusCode', required: false, example: 200 })
  @ApiQuery({ name: 'requestId', required: false, example: '8ac91718-dfc7-484e-8cb2-cdd8fdb6f4d5' })
  @ApiQuery({ name: 'userId', required: false, example: 'user-uuid' })
  @ApiQuery({ name: 'from', required: false, example: '2026-05-09T00:00:00.000Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-05-09T23:59:59.999Z' })
  @ApiResponse({ status: 200, description: 'API logs retrieved', type: ApiLogListResponseDto })
  async findAll(@Query() query: QueryApiLogDto): Promise<BaseResponseDto<ApiLogListResponseDto>> {
    const data = await this.apiLogService.findAll(query);
    return BaseResponseDto.success('API logs retrieved successfully', data);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get API log detail by ID' })
  @ApiParam({ name: 'id', description: 'API log UUID' })
  @ApiResponse({ status: 200, description: 'API log detail retrieved' })
  async findById(@Param('id') id: string): Promise<BaseResponseDto<any>> {
    const data = await this.apiLogService.findById(id);
    return BaseResponseDto.success('API log detail retrieved successfully', data);
  }
}
