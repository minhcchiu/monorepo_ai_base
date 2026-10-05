import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { PaginationResponseDto, BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles, ApiScope } from '../../common/decorators';

@ApiTags('admin - subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
@Controller('admin')
export class AdminSubscriptionsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List subscriptions (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'CANCELED', 'GRACE'] })
  @ApiQuery({ name: 'plan', required: false, enum: ['WEEKLY', 'MONTHLY', 'YEARLY', 'LIFETIME'] })
  async findAll(
    @Query() query: QuerySubscriptionsDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<any>>> {
    const result = await this.service.findAll(query);
    return BaseResponseDto.success('Subscriptions retrieved successfully', result);
  }

  @Get('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.findById(id);
    return BaseResponseDto.success('Subscription retrieved successfully', result);
  }

  @Patch('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update subscription (chỉnh tay trạng thái/gói/ngày hết hạn)' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiBody({ type: UpdateSubscriptionDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.update(id, dto);
    return BaseResponseDto.success('Subscription updated successfully', result);
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.delete(id);
    return BaseResponseDto.success('Subscription deleted successfully', result);
  }
}
