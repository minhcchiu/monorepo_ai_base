import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseResponseDto, PaginationResponseDto } from '../../common/dtos';
import { CurrentUserId, Roles, ApiScope, ApiOkPaginated } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { NotificationType } from '../../common/constants/enums';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminSendUserNotificationDto } from './dto/admin-send-user-notification.dto';
import { AdminSendManyNotificationsDto } from './dto/admin-send-many-notifications.dto';
import { AdminBroadcastNotificationDto } from './dto/admin-broadcast-notification.dto';
import {
  AdminNotificationListItemDto,
  QueryAdminNotificationsDto,
} from './dto/query-admin-notifications.dto';

@ApiTags('admin')
@ApiScope('admin')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List sent notifications (pagination + filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, description: 'Lọc theo người nhận (UUID)' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiOkPaginated(AdminNotificationListItemDto)
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  async findAll(
    @Query() query: QueryAdminNotificationsDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<AdminNotificationListItemDto>>> {
    const result = await this.service.findAll(query);
    return BaseResponseDto.success('Notifications retrieved successfully', result);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post('send-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send notification to one user' })
  @ApiBody({ type: AdminSendUserNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendToOne(@Body() dto: AdminSendUserNotificationDto, @CurrentUserId() adminId: string) {
    const result = await this.service.sendToOne(dto, adminId);
    return BaseResponseDto.success('Notification sent successfully', result);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post('send-many')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send notification to many users' })
  @ApiBody({ type: AdminSendManyNotificationsDto })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  async sendToMany(@Body() dto: AdminSendManyNotificationsDto, @CurrentUserId() adminId: string) {
    const result = await this.service.sendToMany(dto, adminId);
    return BaseResponseDto.success('Notifications sent successfully', result);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Broadcast notification with role filters' })
  @ApiBody({ type: AdminBroadcastNotificationDto })
  @ApiResponse({ status: 200, description: 'Broadcast completed successfully' })
  async broadcast(@Body() dto: AdminBroadcastNotificationDto, @CurrentUserId() adminId: string) {
    const result = await this.service.broadcast(dto, adminId);
    return BaseResponseDto.success('Broadcast completed successfully', result);
  }
}
