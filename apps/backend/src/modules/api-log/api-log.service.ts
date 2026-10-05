import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiLogListResponseDto, QueryApiLogDto } from './dto';

@Injectable()
export class ApiLogService {
  private readonly logger = new Logger('ApiLogService');

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryApiLogDto): Promise<ApiLogListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.method) where.method = query.method.toUpperCase();
    if (query.path) where.path = { contains: query.path, mode: 'insensitive' };
    if (typeof query.statusCode === 'number') where.statusCode = query.statusCode;
    if (query.requestId) where.requestId = query.requestId;
    if (query.userId) where.userId = query.userId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    this.logger.log(`Query api logs page=${page} limit=${limit}`);

    const [items, total] = await Promise.all([
      this.prisma.apiRequestLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          requestId: true,
          method: true,
          path: true,
          statusCode: true,
          durationMs: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          queryParams: true,
          routeParams: true,
          requestBody: true,
          responseBody: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      this.prisma.apiRequestLog.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const item = await this.prisma.apiRequestLog.findUnique({
      where: { id },
      select: {
        id: true,
        requestId: true,
        method: true,
        path: true,
        statusCode: true,
        durationMs: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        queryParams: true,
        routeParams: true,
        requestBody: true,
        responseBody: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!item) {
      throw new NotFoundException('API log not found');
    }

    return item;
  }
}
