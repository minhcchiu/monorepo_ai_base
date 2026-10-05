import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * RequestIdMiddleware
 *
 * Adds a unique request ID to every incoming request.
 * Useful for:
 * - Request tracing through logs
 * - Correlation across services
 * - Debugging distributed systems
 *
 * Usage in app.module.ts:
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(RequestIdMiddleware).forRoutes('*');
 *   }
 * }
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestIdMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    // Check if request ID already exists (from upstream service)
    const requestIdHeader = req.headers['x-request-id'];
    let requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;

    // Generate new request ID if not provided
    if (!requestId) {
      requestId = uuidv4();
    }

    // Store request ID in request object
    req.headers['x-request-id'] = requestId;

    // Store request ID in response headers
    res.set('x-request-id', requestId);

    // Enrich Sentry scope with request-specific tags/extra.
    // `configureScope` đã bị gỡ từ Sentry v8 — dùng isolation scope (mỗi request
    // một scope riêng). Gọi được cả khi chưa Sentry.init: trả về scope no-op.
    try {
      const scope = Sentry.getIsolationScope();
      scope.setTag('requestId', requestId);
      scope.setExtra('method', req.method);
      scope.setExtra('path', req.path);
    } catch (e) {
      this.logger.warn('Sentry scope enrichment failed', e);
    }

    // Log request
    this.logger.log(`[${requestId}] ${req.method} ${req.path} - IP: ${this.getClientIp(req)}`);

    // Add response logging
    res.on('finish', () => {
      // Attach user info to Sentry scope if available
      try {
        const user = (req as any).user;
        if (user && user.id) {
          Sentry.getIsolationScope().setUser({ id: String(user.id) });
        }
      } catch (e) {
        this.logger.warn('Sentry setUser failed', e);
      }

      this.logger.log(`[${requestId}] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    });

    next();
  }

  /**
   * Get client IP address from request
   * Handles proxies and load balancers
   */
  private getClientIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    const forwarded = Array.isArray(xff) ? xff[0] : xff;
    const realIp = req.headers['x-real-ip'];
    const ip = forwarded || (Array.isArray(realIp) ? realIp[0] : realIp);
    return (ip as string) || req.socket.remoteAddress || 'unknown';
  }
}

/**
 * LoggingMiddleware
 *
 * Logs HTTP request/response details.
 * Useful for debugging and monitoring.
 *
 * Logs:
 * - Request method, path, and duration
 * - Response status code
 * - Request body size (for POST/PUT)
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private sanitizePayload(value: unknown): any {
    if (value === undefined || value === null) return null;
    try {
      const text = JSON.stringify(value);
      if (!text) return null;
      // Prevent oversized log rows while still keeping useful context.
      if (text.length > 8000) {
        return {
          _truncated: true,
          _size: text.length,
          preview: text.slice(0, 8000),
        };
      }
      return JSON.parse(text);
    } catch {
      return { _nonSerializable: true };
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'];
    const apiLogEnabled = this.configService.get<string>('API_LOG_ENABLED') === 'true';
    const requestBody = apiLogEnabled ? this.sanitizePayload(req.body) : null;
    const queryParams = apiLogEnabled ? this.sanitizePayload(req.query) : null;
    const routeParams = apiLogEnabled ? this.sanitizePayload(req.params) : null;
    let responsePayload: any = null;

    // Override res.json to log response
    const originalJson = res.json;
    const logger = this.logger;
    const self = this;
    res.json = function (body) {
      responsePayload = body;
      const duration = Date.now() - startTime;

      // Log response with details using captured logger
      logger.log({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body)),
      });

      return originalJson.call(this, body);
    } as any;

    if (apiLogEnabled) {
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const userId = (req as any).user?.id ?? null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const method = req.method;
        const path = req.originalUrl || req.path;
        const statusCode = res.statusCode;

        void self.prisma.apiRequestLog
          .create({
            data: {
              requestId: Array.isArray(requestId) ? requestId[0] : (requestId ?? null),
              method,
              path,
              statusCode,
              durationMs: duration,
              userId,
              ipAddress,
              userAgent: req.get('user-agent') ?? null,
              queryParams,
              routeParams,
              requestBody,
              responseBody: self.sanitizePayload(responsePayload),
              errorMessage: statusCode >= 500 ? `HTTP_${statusCode}` : null,
            },
          })
          .catch((error) => {
            logger.error('Failed to persist api request log', error);
          });
      });
    }

    next();
  }
}

/**
 * CorsMiddleware
 *
 * Handles CORS (Cross-Origin Resource Sharing) configuration.
 * Can be replaced with @nestjs/common's cors() if preferred.
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
