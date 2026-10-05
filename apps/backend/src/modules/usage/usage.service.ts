import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsageDto, UpdateUsageDto, QueryUsageDto } from './dto';
import { PaginationResponseDto } from '../../common/dtos';

/**
 * UsageService
 *
 * Handles user usage tracking:
 * - Initialize usage tracking for new users
 * - Track action counts and rewards
 * - Update usage metrics
 * - Retrieve usage statistics
 */
@Injectable()
export class UsageService {
  private readonly logger = new Logger('UsageService');

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new usage record
   *
   * @param createUsageDto - Usage data
   * @returns Created usage record
   */
  async create(createUsageDto: CreateUsageDto) {
    this.logger.log(`Creating usage record for user: ${createUsageDto.userId}`);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createUsageDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createUsageDto.userId} not found`);
    }

    // Check if user already has a usage record
    const existingUsage = await this.prisma.usage.findUnique({
      where: { userId: createUsageDto.userId },
    });

    if (existingUsage) {
      throw new ConflictException('User already has a usage record');
    }

    try {
      const usage = await this.prisma.usage.create({
        data: {
          userId: createUsageDto.userId,
          actionCount: createUsageDto.actionCount || 0,
          rewardCount: createUsageDto.rewardCount || 0,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return usage;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating usage record: ${error.message}`);
      throw new BadRequestException('Failed to create usage record');
    }
  }

  /**
   * Get all usage records with pagination and filtering
   *
   * @param query - Query parameters
   * @returns Paginated usage records
   */
  async findAll(query: QueryUsageDto): Promise<PaginationResponseDto<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching usage records - Page: ${page}, Limit: ${limit}`);

    const where: any = {};

    // Build filter conditions
    if (query.userId) {
      where.userId = query.userId;
    }

    try {
      const [usages, total] = await Promise.all([
        this.prisma.usage.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: {
            [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
          },
        }),
        this.prisma.usage.count({ where }),
      ]);

      return new PaginationResponseDto(usages, page, limit, total);
    } catch (error) {
      this.logger.error(`Error fetching usage records: ${error.message}`);
      throw new BadRequestException('Failed to fetch usage records');
    }
  }

  /**
   * Get usage record by ID
   *
   * @param id - Usage ID
   * @returns Usage data
   */
  async findById(id: string) {
    this.logger.log(`Fetching usage record: ${id}`);

    try {
      const usage = await this.prisma.usage.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record with ID ${id} not found`);
      }

      return usage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching usage record: ${error.message}`);
      throw new BadRequestException('Failed to fetch usage record');
    }
  }

  /**
   * Get usage record by user ID
   *
   * @param userId - User ID
   * @returns Usage data or null if not found
   */
  async findByUserId(userId: string) {
    this.logger.log(`Fetching usage record for user: ${userId}`);

    try {
      const usage = await this.prisma.usage.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!usage) {
        throw new NotFoundException(`No usage record found for user ${userId}`);
      }

      return usage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching user usage record: ${error.message}`);
      throw new BadRequestException('Failed to fetch user usage record');
    }
  }

  /**
   * Update usage record
   *
   * @param id - Usage ID
   * @param updateUsageDto - Updated usage data
   * @returns Updated usage record
   */
  async update(id: string, updateUsageDto: UpdateUsageDto) {
    this.logger.log(`Updating usage record: ${id}`);

    // Verify usage record exists
    const usage = await this.findById(id);

    try {
      const updated = await this.prisma.usage.update({
        where: { id },
        data: {
          actionCount: updateUsageDto.actionCount ?? usage.actionCount,
          lastActionDate: updateUsageDto.lastActionDate
            ? new Date(updateUsageDto.lastActionDate)
            : usage.lastActionDate,
          rewardCount: updateUsageDto.rewardCount ?? usage.rewardCount,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return updated;
    } catch (error) {
      this.logger.error(`Error updating usage record: ${error.message}`);
      throw new BadRequestException('Failed to update usage record');
    }
  }

  /**
   * Increment action count for a user
   *
   * @param userId - User ID
   * @returns Updated usage record
   */
  async incrementActionCount(userId: string) {
    this.logger.log(`Incrementing action count for user: ${userId}`);

    try {
      const usage = await this.prisma.usage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const updated = await this.prisma.usage.update({
        where: { userId },
        data: {
          actionCount: usage.actionCount + 1,
          lastActionDate: new Date(),
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return updated;
    } catch (error) {
      this.logger.error(`Error incrementing action count: ${error.message}`);
      throw new BadRequestException('Failed to increment action count');
    }
  }

  /**
   * Increment reward count for a user
   *
   * @param userId - User ID
   * @param amount - Amount to increment (default 1)
   * @returns Updated usage record
   */
  async incrementRewardCount(userId: string, amount: number = 1) {
    this.logger.log(`Incrementing reward count for user: ${userId} by ${amount}`);

    try {
      const usage = await this.prisma.usage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const updated = await this.prisma.usage.update({
        where: { userId },
        data: {
          rewardCount: usage.rewardCount + amount,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return updated;
    } catch (error) {
      this.logger.error(`Error incrementing reward count: ${error.message}`);
      throw new BadRequestException('Failed to increment reward count');
    }
  }

  /**
   * Delete usage record
   *
   * @param id - Usage ID
   */
  async delete(id: string) {
    this.logger.log(`Deleting usage record: ${id}`);

    // Verify usage record exists
    await this.findById(id);

    try {
      await this.prisma.usage.delete({
        where: { id },
      });

      return { message: 'Usage record deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting usage record: ${error.message}`);
      throw new BadRequestException('Failed to delete usage record');
    }
  }
}
