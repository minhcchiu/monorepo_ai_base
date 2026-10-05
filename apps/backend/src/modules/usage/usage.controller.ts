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
import { UsageService } from './usage.service';
import { CreateUsageDto, UpdateUsageDto, QueryUsageDto } from './dto';
import { PaginationResponseDto, BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard, RoleGuard } from '../../common/guards';
import { ApiScope, CurrentUserId, Roles } from '../../common/decorators';

/**
 * UsageController
 *
 * Handles usage tracking endpoints:
 * - POST /usage - Create new usage record
 * - GET /usage - List all usage records (paginated)
 * - GET /usage/my - Get current user's usage
 * - POST /usage/consume - Consume one action unit of the current user's own quota
 * - GET /usage/:id - Get usage by ID
 * - PATCH /usage/:id - Update usage record
 * - DELETE /usage/:id - Delete usage record
 * - PATCH /usage/:userId/increment-actions - Increment action count
 */
@Controller('usage')
@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
export class UsageController {
  private readonly logger = new Logger('UsageController');

  constructor(private usageService: UsageService) {}

  /**
   * Create a new usage record
   *
   * @param createUsageDto - Usage data
   * @returns Created usage record
   *
   * @example
   * POST /usage
   * {
   *   "userId": "user-id",
   *   "actionCount": 0,
   *   "rewardCount": 0
   * }
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new usage record' })
  @ApiBody({ type: CreateUsageDto })
  @ApiResponse({ status: 201, description: 'Usage record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid usage data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already has a usage record' })
  async create(
    @Body() createUsageDto: CreateUsageDto,
    @CurrentUserId() adminUserId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(
      `Admin ${adminUserId} creating usage record for user: ${createUsageDto.userId}`,
    );
    const result = await this.usageService.create(createUsageDto);
    return BaseResponseDto.success('Usage record created successfully', result);
  }

  /**
   * Get all usage records with pagination and filtering
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of usage records
   *
   * @example
   * GET /usage?page=1&limit=10
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all usage records (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc' })
  @ApiResponse({ status: 200, description: 'Usage records retrieved successfully' })
  async findAll(
    @Query() query: QueryUsageDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<any>>> {
    this.logger.log(`Fetching all usage records - Page: ${query.page}, Limit: ${query.limit}`);
    const result = await this.usageService.findAll(query);
    return BaseResponseDto.success('Usage records retrieved successfully', result);
  }

  /**
   * Get current user's usage
   *
   * @param userId - Current user ID
   * @returns User's usage data
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user usage' })
  @ApiResponse({ status: 200, description: 'User usage retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No usage record found for user' })
  async getMyUsage(@CurrentUserId() userId: string): Promise<BaseResponseDto<any>> {
    this.logger.log(`Fetching usage for user: ${userId}`);
    const result = await this.usageService.findByUserId(userId);
    return BaseResponseDto.success('User usage retrieved successfully', result);
  }

  /**
   * Consume one action unit of the current user's own quota
   *
   * Any authenticated app user can call this to record that they performed
   * a quota-costing action. This is the client-reachable counterpart to the
   * admin-only `PATCH /usage/:userId/increment-actions` route below — it
   * always operates on the caller's own usage record (via @CurrentUserId()),
   * never an arbitrary userId.
   *
   * @param userId - Current user ID (from JWT, not a path param)
   * @returns Updated usage record
   *
   * @example
   * POST /usage/consume
   *
   * NOTE: the class-level @UseGuards(JwtAuthGuard, RoleGuard) still runs for
   * this route (Nest stacks controller + route guards, it does not replace
   * them), and RoleGuard falls back to the class-level @Roles('ADMIN') via
   * getAllAndOverride() when a handler has no roles of its own. The empty
   * @Roles() below is required to override that back down to "any
   * authenticated user" — removing it would silently make this admin-only.
   */
  @UseGuards(JwtAuthGuard)
  @Roles()
  @ApiScope('app')
  @Post('consume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Consume one action unit of the current user's own quota" })
  @ApiResponse({ status: 200, description: 'Action count incremented successfully' })
  @ApiResponse({ status: 404, description: 'No usage record found for user' })
  async consume(@CurrentUserId() userId: string): Promise<BaseResponseDto<any>> {
    this.logger.log(`User ${userId} consuming one action unit of their own usage quota`);
    const result = await this.usageService.incrementActionCount(userId);
    return BaseResponseDto.success('Action count incremented successfully', result);
  }

  /**
   * Get usage record by ID
   *
   * @param id - Usage ID
   * @returns Usage data
   *
   * @example
   * GET /usage/:id
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get usage record by ID' })
  @ApiParam({ name: 'id', description: 'Usage UUID' })
  @ApiResponse({ status: 200, description: 'Usage record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Usage record not found' })
  async findById(@Param('id') id: string): Promise<BaseResponseDto<any>> {
    this.logger.log(`Fetching usage record: ${id}`);
    const result = await this.usageService.findById(id);
    return BaseResponseDto.success('Usage record retrieved successfully', result);
  }

  /**
   * Update usage record
   *
   * @param id - Usage ID
   * @param updateUsageDto - Updated usage data
   * @param userId - Current user ID (for ownership verification)
   * @returns Updated usage record
   *
   * @example
   * PATCH /usage/:id
   * {
   *   "actionCount": 5,
   *   "rewardCount": 10
   * }
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update usage record' })
  @ApiParam({ name: 'id', description: 'Usage UUID' })
  @ApiBody({ type: UpdateUsageDto })
  @ApiResponse({ status: 200, description: 'Usage record updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the usage owner' })
  @ApiResponse({ status: 404, description: 'Usage record not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUsageDto: UpdateUsageDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Updating usage record: ${id} for user: ${userId}`);
    const result = await this.usageService.update(id, updateUsageDto);
    return BaseResponseDto.success('Usage record updated successfully', result);
  }

  /**
   * Delete usage record
   *
   * @param id - Usage ID
   * @param userId - Current user ID (for ownership verification)
   *
   * @example
   * DELETE /usage/:id
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete usage record' })
  @ApiParam({ name: 'id', description: 'Usage UUID' })
  @ApiResponse({ status: 200, description: 'Usage record deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the usage owner' })
  @ApiResponse({ status: 404, description: 'Usage record not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Deleting usage record: ${id} for user: ${userId}`);
    const result = await this.usageService.delete(id);
    return BaseResponseDto.success('Usage record deleted successfully', result);
  }

  /**
   * Increment action count
   *
   * @param userId - User ID
   * @returns Updated usage record
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':userId/increment-actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment action count' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Action count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Usage record not found' })
  async incrementActionCount(
    @Param('userId') userId: string,
    @CurrentUserId() adminUserId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Admin ${adminUserId} incrementing action count for user: ${userId}`);
    const result = await this.usageService.incrementActionCount(userId);
    return BaseResponseDto.success('Action count incremented successfully', result);
  }
}
