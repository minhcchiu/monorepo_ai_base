import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { HttpExceptionFilter, PrismaExceptionFilter, AllExceptionsFilter } from './common/filters';
import { AppConfigService } from './config/app-config.service';
import * as Sentry from '@sentry/node';
import { setupDocs } from './docs/docs.setup';

const logger = new Logger('Bootstrap');

/**
 * Application Bootstrap
 *
 * Initializes the NestJS application with:
 * - Global validation pipes
 * - Global exception filters
 * - Middleware setup
 * - Graceful shutdown handling
 * - Database connection lifecycle
 *
 * This is production-ready configuration following best practices.
 */
async function bootstrap() {
  // Create the application
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['debug', 'log', 'error', 'warn'],
  });

  // Enable CORS for web clients
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'user-type'],
    credentials: true,
  });

  // Increase payload size limits to support bulk APIs / large payloads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Get config service
  const configService = app.get(AppConfigService);
  const prisma = app.get(PrismaService);

  // Initialize Sentry only when a DSN is provided via env (no hardcoded DSN in source).
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    try {
      Sentry.init({
        dsn: sentryDsn,
        debug: process.env.NODE_ENV !== 'production',
        environment: configService?.getNodeEnv?.() || process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1,
        attachStacktrace: true,
      });
      logger.log('Sentry initialized');
    } catch (e) {
      logger.warn('Sentry initialization failed', e);
    }
  } else {
    logger.log('Sentry disabled (no SENTRY_DSN set)');
  }

  // Attach Sentry request and tracing handlers to capture per-request context
  try {
    // Request handler creates a Sentry scope for each incoming request
    app.use((Sentry as any).Handlers.requestHandler());
    // Tracing handler for performance tracing (optional)
    app.use((Sentry as any).Handlers.tracingHandler());
    logger.log('Sentry request/tracing handlers attached');
  } catch (e) {
    logger.warn('Failed to attach Sentry handlers', e);
  }

  // ============================================================================
  // Global Exception Filters
  // ============================================================================

  // Order matters: More specific filters first, catch-all last
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new AllExceptionsFilter(),
  );

  // ============================================================================
  // Global Validation Pipe
  // ============================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties not defined in DTO
      whitelist: true,
      forbidNonWhitelisted: true,

      // Transform payloads to DTO instances
      transform: true,
    }),
  );

  // Set global API prefix (e.g. /api/v1)
  const apiPrefix = configService.getApiPrefix();
  const apiVersion = configService.getApiVersion();
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Setup docs (OpenAPI JSON + UI)
  // Implementation moved to src/docs/docs.setup.ts for better organization
  await setupDocs(app, configService);

  // Serve uploaded files folder at /uploads so uploaded assets are publicly accessible
  // e.g. GET /uploads/avatar/abc.jpg
  app.use('/uploads', express.static(join(process.cwd(), 'public', 'uploads')));

  // ============================================================================
  // Database Lifecycle
  // ============================================================================

  // Enable database shutdown hooks
  await prisma.enableShutdownHooks(app);

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  // Handle SIGTERM signal
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Handle SIGINT signal (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.warn('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    try {
      Sentry.captureException(error);
    } catch (e) {
      // ignore Sentry failures
    }
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    try {
      Sentry.captureException(reason);
    } catch (e) {
      // ignore Sentry failures
    }
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // ============================================================================
  // Start Server
  // ============================================================================

  const port = configService.getPort();
  const nodeEnv = configService.getNodeEnv();

  await app.listen(port, '0.0.0.0');
  logger.log(`✅ Application listening on port ${port} (0.0.0.0)`);
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`📚 API Prefix: /${apiPrefix}/${apiVersion}`);
  logger.log(`🚀 Ready to accept requests`);
}

// Start the application
bootstrap().catch((error) => {
  try {
    Sentry.captureException(error);
  } catch (e) {
    // ignore Sentry failures
  }
  logger.error('Failed to bootstrap application:', error);
  process.exit(1);
});
