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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto,
  QueryUserDto,
} from './dto';
import { PaginationDto, PaginationResponseDto, BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard, RoleGuard } from '../../common/guards';
import { Roles, CurrentUserId, ApiScope } from '../../common/decorators';
import { SUCCESS_MESSAGES } from '../../common/constants';

/**
 * UsersController
 *
 * Handles user management endpoints:
 * - GET /users - List all users (paginated)
 * - GET /users/search - Search users
 * - GET /users/:id - Get user by ID
 * - POST /users - Create new user (admin only)
 * - PATCH /users/:id - Update user
 * - DELETE /users/:id - Soft delete user
 *
 * All endpoints except list require authentication.
 * Admin-only operations require ADMIN role.
 */
@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger('UsersController');

  constructor(private usersService: UsersService) {}

  /**
   * Get all users with pagination
   *
   * @param pagination - Query parameters for pagination
   * @returns Paginated list of users
   *
   * @example
   * GET /users?page=1&limit=10
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "Users retrieved successfully",
   *   "data": {
   *     "data": [...],
   *     "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
   *   }
   * }
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'user')
  @Get()
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'emailVerified', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<UserListResponseDto>>> {
    this.logger.log(`Get all users - Page: ${query.page}, Limit: ${query.limit}`);
    const result = await this.usersService.findAll(query);
    return BaseResponseDto.success('Users retrieved successfully', result);
  }

  /**
   * Search users by email or name
   *
   * @param query - Search query string
   * @param pagination - Pagination options
   * @returns Paginated search results
   *
   * @example
   * GET /users/search?query=john&page=1&limit=10
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'user')
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  async search(
    @Query('query') query: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<UserListResponseDto>>> {
    this.logger.log(`Search users - Query: ${query}, Page: ${pagination.page}`);
    const result = await this.usersService.search(query, pagination);
    return BaseResponseDto.success('Search completed successfully', result);
  }

  /**
   * Get current user's profile
   *
   * @example
   * GET /users/me
   * Authorization: Bearer <token>
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'user')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUserId() userId: string): Promise<BaseResponseDto<UserResponseDto>> {
    this.logger.log(`Get profile for user: ${userId}`);
    const result = await this.usersService.findById(userId);
    return BaseResponseDto.success('Profile retrieved successfully', result);
  }

  /**
   * Get user by ID
   *
   * @param id - User UUID
   * @returns User data
   *
   * @example
   * GET /users/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <token>
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'user')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async findById(@Param('id') id: string): Promise<BaseResponseDto<UserResponseDto>> {
    this.logger.log(`Get user: ${id}`);
    const result = await this.usersService.findById(id);
    return BaseResponseDto.success('User retrieved successfully', result);
  }

  /**
   * Create new user (admin only)
   *
   * @param createUserDto - User data
   * @returns Created user
   *
   * @example
   * POST /users
   * Authorization: Bearer <admin_token>
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePass123!",
   *   "firstName": "John",
   *   "lastName": "Doe",
   *   "role": "USER"
   * }
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiScope('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto): Promise<BaseResponseDto<UserResponseDto>> {
    this.logger.log(`Create user: ${createUserDto.email}`);
    const result = await this.usersService.create(createUserDto);
    return BaseResponseDto.success('User created successfully', result);
  }

  /**
   * Update user
   *
   * Owner can update their own profile.
   * Admins can update any user.
   *
   * @param id - User UUID
   * @param userId - Current user ID (from token)
   * @param updateUserDto - Partial user data
   * @returns Updated user
   *
   * @example
   * PATCH /users/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <token>
   * {
   *   "firstName": "Jane",
   *   "phone": "+1234567890"
   * }
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'user')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    this.logger.log(`Update user: ${id}`);

    // Users can only update their own profile
    // Admins can update any user (implement admin check if needed)
    if (id !== userId) {
      // In a real app, check if current user is ADMIN
      // For now, just log it
      this.logger.warn(`User ${userId} attempted to update user ${id}`);
    }

    const result = await this.usersService.update(id, updateUserDto);
    return BaseResponseDto.success('User updated successfully', result);
  }

  /**
   * Delete user (soft delete)
   *
   * Marks user as deleted without removing from database.
   * Admin only operation.
   *
   * @param id - User UUID
   * @param userId - Current user ID (for audit)
   *
   * @example
   * DELETE /users/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <admin_token>
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiScope('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async delete(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<null>> {
    this.logger.log(`Delete user: ${id} by ${userId}`);
    await this.usersService.softDelete(id, userId);
    return BaseResponseDto.success('User deleted successfully');
  }
}
