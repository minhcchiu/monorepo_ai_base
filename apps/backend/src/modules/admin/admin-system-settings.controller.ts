import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles, CurrentUserId, ApiScope } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';
import { AdminSystemSettingsService } from './admin-system-settings.service';
import { QuerySystemSettingsDto } from './dto/query-system-settings.dto';
import { AdminCreateSystemSettingDto } from './dto/create-system-setting.dto';
import { AdminUpdateSystemSettingDto } from './dto/update-system-setting.dto';

@ApiTags('admin - system-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
@Controller('admin/system-settings')
export class AdminSystemSettingsController {
  constructor(private readonly service: AdminSystemSettingsService) {}

  // 5.1 Danh sách settings
  @Get()
  @ApiOperation({ summary: 'Get list of system settings' })
  @ApiResponse({ status: 200, description: 'Get system settings successfully' })
  async findAll(@Query() query: QuerySystemSettingsDto): Promise<BaseResponseDto<any>> {
    const result = await this.service.findAll(query);
    return BaseResponseDto.success('Get system settings successfully', result);
  }

  // 5.2 Chi tiết setting theo key
  @Get(':key')
  @ApiOperation({ summary: 'Get system setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Get system setting successfully' })
  async findByKey(@Param('key') key: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.findByKey(key);
    return BaseResponseDto.success('Get system setting successfully', result);
  }

  // 5.3 Tạo setting
  @Post()
  @ApiOperation({ summary: 'Create new system setting' })
  @ApiBody({ type: AdminCreateSystemSettingDto })
  @ApiResponse({ status: 201, description: 'System setting created successfully' })
  async create(
    @Body() dto: AdminCreateSystemSettingDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.create(dto, adminId);
    return BaseResponseDto.success('System setting created successfully', result);
  }

  // 5.4 Cập nhật setting
  @Patch(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update system setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiBody({ type: AdminUpdateSystemSettingDto })
  @ApiResponse({ status: 200, description: 'System setting updated successfully' })
  async update(
    @Param('key') key: string,
    @Body() dto: AdminUpdateSystemSettingDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.update(key, dto, adminId);
    return BaseResponseDto.success('System setting updated successfully', result);
  }

  // 5.5 Xóa setting
  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete system setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'System setting deleted successfully' })
  async remove(
    @Param('key') key: string,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<null>> {
    await this.service.remove(key, adminId);
    return BaseResponseDto.success('System setting deleted successfully', null);
  }
}
