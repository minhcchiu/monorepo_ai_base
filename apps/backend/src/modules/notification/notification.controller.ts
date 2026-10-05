import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { RemoveDeviceTokenDto } from './dto/remove-device-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUserId, ApiScope } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiScope('app', 'user')
@Controller('notification')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiBody({ type: CreateNotificationDto })
  async create(@Body() dto: CreateNotificationDto, @CurrentUserId() userId: string) {
    dto.userId = dto.userId || userId;
    const result = await this.service.create(dto);
    return BaseResponseDto.success('Notification created successfully', result);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register current device FCM token' })
  @ApiResponse({ status: 200, description: 'Device token registered successfully' })
  @ApiBody({ type: RegisterDeviceTokenDto })
  async registerDeviceToken(@Body() dto: RegisterDeviceTokenDto, @CurrentUserId() userId: string) {
    const result = await this.service.registerDeviceToken(userId, dto.token);
    return BaseResponseDto.success('Device token registered successfully', result);
  }

  @Post('device-token/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove current device FCM token' })
  @ApiResponse({ status: 200, description: 'Device token removed successfully' })
  @ApiBody({ type: RemoveDeviceTokenDto })
  async removeDeviceToken(@Body() dto: RemoveDeviceTokenDto, @CurrentUserId() userId: string) {
    const result = await this.service.removeDeviceToken(userId, dto.token);
    return BaseResponseDto.success('Device token removed successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications (pagination + filters)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() query: QueryNotificationDto, @CurrentUserId() userId: string) {
    const result = await this.service.findAll(query, userId);
    return BaseResponseDto.success('Notifications retrieved successfully', result);
  }

  @Get('me')
  @ApiOperation({ summary: 'Load notifications of current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findMine(@Query() query: QueryNotificationDto, @CurrentUserId() userId: string) {
    const result = await this.service.findMyNotifications(query, userId);
    return BaseResponseDto.success('Notifications retrieved successfully', result);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Count unread notifications of current user' })
  @ApiResponse({ status: 200, description: 'Unread notifications counted successfully' })
  async unread(@CurrentUserId() userId: string) {
    const result = await this.service.countUnreadNotifications(userId);
    return BaseResponseDto.success('Unread notifications counted successfully', result);
  }

  @Post('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
  @ApiBody({ type: ReadNotificationDto })
  async readNotification(@Body() dto: ReadNotificationDto, @CurrentUserId() userId: string) {
    const result = await this.service.readNotification(dto.idNotification, userId);
    return BaseResponseDto.success('Notification marked as read successfully', result);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read successfully' })
  async readAll(@CurrentUserId() userId: string) {
    const result = await this.service.readAllNotifications(userId);
    return BaseResponseDto.success('All notifications marked as read successfully', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by id' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUserId() userId: string) {
    const result = await this.service.findOne(id, userId);
    return BaseResponseDto.success('Notification retrieved successfully', result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateNotificationDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateNotificationDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.service.update(id, dto, userId);
    return BaseResponseDto.success('Notification updated successfully', result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification (soft)' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUserId() userId: string) {
    await this.service.remove(id, userId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted notification' })
  @ApiParam({ name: 'id' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUserId() userId: string) {
    const result = await this.service.restore(id, userId);
    return BaseResponseDto.success('Notification restored successfully', result);
  }
}
