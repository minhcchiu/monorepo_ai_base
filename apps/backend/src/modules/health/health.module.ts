import { Module } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * HealthModule
 *
 * Health check and monitoring feature module.
 * Provides endpoints for application health monitoring.
 *
 * Endpoints:
 * - GET /health - Overall health status
 * - GET /health/readiness - Readiness probe
 * - GET /health/liveness - Liveness probe
 * - GET /health/info - Application info
 *
 * Usage:
 * - Kubernetes health checks
 * - Load balancer health probes
 * - Monitoring and alerting systems
 */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthCheckService],
})
export class HealthModule {}
