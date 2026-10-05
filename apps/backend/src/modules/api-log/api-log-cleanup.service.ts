import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiLogCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('ApiLogCleanupService');
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMinutesRaw = this.configService.get<string>('API_LOG_CLEANUP_INTERVAL_MINUTES');
    const intervalMinutes = Math.max(5, Number.parseInt(intervalMinutesRaw || '60', 10) || 60);

    this.timer = setInterval(
      () => {
        void this.cleanupExpiredLogs();
      },
      intervalMinutes * 60 * 1000,
    );

    this.timer.unref?.();

    // Run once on startup so stale rows are removed without waiting for interval.
    void this.cleanupExpiredLogs();

    this.logger.log(`API log cleanup scheduler started (interval=${intervalMinutes} minutes)`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async cleanupExpiredLogs() {
    const retentionDaysRaw = this.configService.get<string>('API_LOG_RETENTION_DAYS');
    const retentionDays = Math.max(1, Number.parseInt(retentionDaysRaw || '30', 10) || 30);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.prisma.apiRequestLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Deleted ${result.count} API logs older than ${retentionDays} days`);
      }
    } catch (error) {
      this.logger.error('API log cleanup failed', error);
    }
  }
}
