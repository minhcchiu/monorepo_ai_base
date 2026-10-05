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
  ParseUUIDPipe,
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
import { Roles, CurrentUserId, ApiScope, ApiOkData, ApiOkPaginated } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';
import { UserResponseDto, UserListResponseDto } from '../users/dto/user.dto';
import { AdminUsersService } from './admin-users.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('admin - users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  // 1.1 Danh sách users
  @Get('users')
  @ApiOperation({ summary: 'Get list of users' })
  @ApiOkPaginated(UserListResponseDto)
  async findAll(@Query() query: QueryUsersDto): Promise<BaseResponseDto<any>> {
    const result = await this.service.findAll(query);
    return BaseResponseDto.success('Get users successfully', result);
  }

  // 1.2 Chi tiết user
  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkData(UserResponseDto)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.findOne(id);
    return BaseResponseDto.success('Get user successfully', result);
  }

  // 1.3 Tạo user mới
  @Post('users')
  @ApiOperation({ summary: 'Create new user' })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(
    @Body() dto: AdminCreateUserDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.create(dto, adminId);
    return BaseResponseDto.success('User created successfully', result);
  }

  // 1.4 Cập nhật user
  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiOkData(UserResponseDto)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.update(id, dto, adminId);
    return BaseResponseDto.success('User updated successfully', result);
  }

  // 1.5 Xóa user (soft delete)
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<null>> {
    await this.service.remove(id, adminId);
    return BaseResponseDto.success('User deleted successfully', null);
  }

  // 1.6 Đổi mật khẩu admin (chính mình)
  @Patch('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password' })
  @ApiBody({ type: AdminChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Body() dto: AdminChangePasswordDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<null>> {
    await this.service.changePassword(adminId, dto);
    return BaseResponseDto.success('Password changed successfully', null);
  }

  // 1.7 Cập nhật thông tin cá nhân admin
  @Patch('me/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkData(UserResponseDto)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUserId() adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.updateProfile(adminId, dto);
    return BaseResponseDto.success('Profile updated successfully', result);
  }

  // Legacy: toggle status
  @Post('users/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle user status (lock/unlock)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: 200, description: 'User status toggled' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.toggleStatus(id, userId);
    return BaseResponseDto.success('User status toggled', result);
  }
}
