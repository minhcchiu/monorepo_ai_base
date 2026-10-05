import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { PaginationResponseDto } from '../../common/dtos';

const USER_SUMMARY_SELECT = { id: true, email: true, firstName: true, lastName: true };

@Injectable()
export class AdminSubscriptionsService {
  private readonly logger = new Logger('AdminSubscriptionsService');

  constructor(private prisma: PrismaService) {}

  async findAll(query: QuerySubscriptionsDto): Promise<PaginationResponseDto<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.plan) where.plan = query.plan;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: USER_SUMMARY_SELECT } },
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return new PaginationResponseDto(subscriptions, page, limit, total);
  }

  async findById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: { select: USER_SUMMARY_SELECT } },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.findById(id);

    try {
      return await this.prisma.subscription.update({
        where: { id },
        data: {
          status: dto.status ?? subscription.status,
          plan: dto.plan ?? subscription.plan,
          startDate: dto.startDate ? new Date(dto.startDate) : subscription.startDate,
          endDate: dto.endDate ? new Date(dto.endDate) : subscription.endDate,
        },
        include: { user: { select: USER_SUMMARY_SELECT } },
      });
    } catch (error: any) {
      this.logger.error(`Error updating subscription: ${error.message}`);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.subscription.delete({ where: { id } });
    return { message: 'Subscription deleted successfully' };
  }
}
