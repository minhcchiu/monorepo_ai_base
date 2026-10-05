import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * HealthCheckService
 *
 * Provides health check functionality for the application.
 * Monitors:
 * - Database connectivity
 * - Memory usage
 * - Uptime
 * - API responsiveness
 *
 * Used for:
 * - Kubernetes/Docker health checks
 * - Load balancer health probes
 * - Monitoring and alerting systems
 */
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger('HealthCheckService');
  private readonly startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  /**
   * Check if application is healthy
   *
   * @returns Health status object
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: { status: 'ok' | 'error'; message?: string };
      memory: { status: 'ok' | 'warning'; usedMB: number; totalMB: number };
      uptime: { seconds: number };
    };
    timestamp: string;
  }> {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      uptime: this.checkUptime(),
    };

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (checks.database.status === 'error') {
      status = 'unhealthy';
    } else if (checks.memory.status === 'warning') {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed application info
   */
  async getInfo(): Promise<{
    name: string;
    version: string;
    environment: string;
    nodeVersion: string;
    platform: string;
  }> {
    return {
      name: process.env.APP_NAME || 'NestJS Backend',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Check database connectivity
   *
   * @returns Database health status
   */
  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      // Simple database ping
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): {
    status: 'ok' | 'warning';
    usedMB: number;
    totalMB: number;
  } {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    // Warning if more than 80% of heap is used
    const usagePercent = (usedMB / totalMB) * 100;
    const status = usagePercent > 80 ? 'warning' : 'ok';

    return { status, usedMB, totalMB };
  }

  /**
   * Check application uptime
   */
  private checkUptime(): { seconds: number } {
    const uptimeMs = Date.now() - this.startTime;
    return { seconds: Math.floor(uptimeMs / 1000) };
  }
}
