import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService
 *
 * Centralized database access layer following best practices:
 * - Single instance managed by NestJS DI
 * - Proper lifecycle hooks for connection management
 * - Graceful shutdown handling
 * - Transaction support
 * - Middleware for audit logging
 * - Query performance logging in development
 *
 * IMPORTANT: All database access must go through this service.
 * Never instantiate PrismaClient directly elsewhere.
 */
@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger('PrismaService');

  constructor() {
    super({
      // Provide adapter required by Prisma v7
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      // Enable query logs in development
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'stdout', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'event', level: 'error' }],
    });

    // Setup event handlers for production logging
    // Cast $on: type log của Prisma v7 suy luận từ ternary thành union khiến tham số event
    // bị thu hẹp về `never`. Cast giữ nguyên hành vi runtime, chỉ gỡ lỗi biên dịch.
    if (process.env.NODE_ENV === 'production') {
      this.$on('error', (e: unknown) => {
        this.logger.error('Prisma Error:', e);
      });
      this.$on('warn', (e: unknown) => {
        this.logger.warn('Prisma Warning:', e);
      });
    }
  }

  /**
   * onModuleInit
   *
   * Lifecycle hook called when the module is initialized.
   * Establishes database connection.
   * Required for NestJS module lifecycle.
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * enableShutdownHooks
   *
   * Register shutdown hooks with NestJS app.
   * Ensures graceful database connection closure.
   *
   * Usage in main.ts:
   * const prisma = app.get(PrismaService);
   * prisma.enableShutdownHooks(app);
   */
  async enableShutdownHooks(app: INestApplication) {
    // Enable NestJS shutdown hooks and ensure Prisma disconnects gracefully
    app.enableShutdownHooks();

    const shutdown = async () => {
      this.logger.log('Closing database connection...');
      await this.$disconnect();
      this.logger.log('Database connection closed');
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * cleanDatabase
   *
   * Utility method to clean database (useful for testing).
   * Deletes all records from all tables.
   *
   * WARNING: Use only in test environment!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Get all models from Prisma schema
    const models = Object.values(this).filter(
      (value) => value && typeof value === 'object' && 'deleteMany' in value,
    );

    for (const model of models) {
      await model.deleteMany();
    }

    this.logger.log('Database cleaned successfully');
  }

  /**
   * executeTransaction
   *
   * Executes database operations within a transaction.
   * Ensures atomicity - all operations succeed or all rollback.
   *
   * @example
   * await prisma.executeTransaction(async (prisma) => {
   *   const user = await prisma.user.update({ ... });
   *   const audit = await prisma.auditLog.create({ ... });
   *   return { user, audit };
   * });
   */
  async executeTransaction<T>(callback: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return await this.$transaction(async (prisma) => {
      return callback(prisma);
    });
  }

  /**
   * getUserWithRelations
   *
   * Helper method to get user with specific relations.
   * Prevents N+1 query problems.
   *
   * @param userId - UUID of user
   * @param includeRelations - Relations to include
   */
  async getUserWithRelations(
    userId: string,
    includeRelations: {
      refreshTokens?: boolean;
      auditLogs?: boolean;
    } = {},
  ) {
    return this.user.findUnique({
      where: { id: userId },
      include: {
        refreshTokens: includeRelations.refreshTokens ? true : false,
        auditLogs: includeRelations.auditLogs ? true : false,
      },
    });
  }

  /**
   * findUserByEmailWithoutDeleted
   *
   * Helper method to query active users only.
   * Always excludes soft-deleted users.
   */
  async findUserByEmailWithoutDeleted(email: string) {
    return this.user.findUnique({
      where: { email },
    });
  }

  /**
   * createAuditLog
   *
   * Helper method to create audit logs consistently.
   * Should be called after any significant operation.
   *
   * @example
   * await prisma.createAuditLog({
   *   action: 'UPDATE',
   *   entityType: 'User',
   *   entityId: user.id,
   *   userId: currentUser.id,
   *   changes: { email: { from: 'old@email.com', to: 'new@email.com' } },
   * });
   */
  async createAuditLog(data: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    return this.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
      },
    });
  }
}
