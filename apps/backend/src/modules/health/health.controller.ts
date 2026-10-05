import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { Public } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';

/**
 * HealthController
 *
 * Provides health check endpoints for monitoring and observability.
 *
 * Endpoints:
 * - GET /health - Health status check
 * - GET /health/info - Application info
 * - GET /health/readiness - Readiness probe
 * - GET /health/liveness - Liveness probe
 *
 * These endpoints are public (no authentication required) as they're used by
 * load balancers, Kubernetes, and monitoring systems.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger('HealthController');

  constructor(private healthCheckService: HealthCheckService) {}

  /**
   * Basic health check endpoint
   *
   * Returns overall application health status.
   * Used by load balancers and monitoring systems.
   *
   * @example
   * GET /health
   *
   * Response (200):
   * {
   *   "success": true,
   *   "message": "Application is healthy",
   *   "data": {
   *     "status": "healthy",
   *     "checks": {
   *       "database": { "status": "ok" },
   *       "memory": { "status": "ok", "usedMB": 120, "totalMB": 256 },
   *       "uptime": { "seconds": 3600 }
   *     },
   *     "timestamp": "2024-01-20T10:30:00Z"
   *   },
   *   "timestamp": "2024-01-20T10:30:00Z"
   * }
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<BaseResponseDto<any>> {
    const health = await this.healthCheckService.getHealth();

    const statusMessages = {
      healthy: 'Application is healthy',
      degraded: 'Application is running but degraded',
      unhealthy: 'Application is unhealthy',
    };

    const message = statusMessages[health.status];

    this.logger.log(`Health check - Status: ${health.status}`);

    return BaseResponseDto.success(message, health);
  }

  /**
   * Readiness probe endpoint
   *
   * Indicates if the application is ready to accept requests.
   * Used by Kubernetes for readiness probes.
   *
   * Returns 200 if ready, 503 if not ready.
   *
   * @example
   * GET /health/readiness
   */
  @Public()
  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<BaseResponseDto<{ ready: boolean }>> {
    const health = await this.healthCheckService.getHealth();
    const isReady = health.status !== 'unhealthy';

    this.logger.log(`Readiness check - Ready: ${isReady}`);

    return BaseResponseDto.success('Application is ready', { ready: isReady });
  }

  /**
   * Liveness probe endpoint
   *
   * Indicates if the application is still running.
   * Used by Kubernetes for liveness probes.
   *
   * A successful response means the application is alive.
   * If this endpoint doesn't respond, the container is restarted.
   *
   * @example
   * GET /health/liveness
   */
  @Public()
  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  async liveness(): Promise<BaseResponseDto<{ alive: boolean }>> {
    this.logger.debug('Liveness check');
    return BaseResponseDto.success('Application is alive', { alive: true });
  }

  /**
   * Get application info
   *
   * Returns application metadata including version, environment, etc.
   * Useful for debugging and monitoring.
   *
   * @example
   * GET /health/info
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "Application info retrieved",
   *   "data": {
   *     "name": "NestJS Backend",
   *     "version": "1.0.0",
   *     "environment": "production",
   *     "nodeVersion": "v20.0.0",
   *     "platform": "linux"
   *   }
   * }
   */
  @Public()
  @Get('info')
  @HttpCode(HttpStatus.OK)
  async info(): Promise<BaseResponseDto<any>> {
    const info = await this.healthCheckService.getInfo();
    return BaseResponseDto.success('Application info retrieved', info);
  }
}
