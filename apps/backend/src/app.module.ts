import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule, AppConfigService } from './config';
import { CommonServicesModule } from './common/services';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SystemSettingModule } from './modules/system-setting/system-setting.module';
import { UploadModule } from './modules/upload/upload.module';
import { AppInitModule } from './modules/app-init/app-init.module';
import { UsageModule } from './modules/usage/usage.module';
import { RewardModule } from './modules/reward/reward.module';
import { RewardChatModule } from './modules/reward-chat/reward-chat.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrackModule } from './modules/track/track.module';
import { ApiLogModule } from './modules/api-log/api-log.module';
import { SubscriptionApiModule } from './modules/subscription-api/subscription-api.module';
import { VpsModule } from './modules/vps/vps.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module';

// Middleware
import { RequestIdMiddleware, LoggingMiddleware } from './common/middleware';

/**
 * AppModule
 *
 * Root application module that brings together all core feature modules.
 *
 * Import order:
 * 1. ConfigModule (needed by other modules)
 * 2. PrismaModule (global db access)
 * 3. Feature modules (Auth, Users, etc.)
 *
 * Global configuration:
 * - Exception filters & validation pipe applied in main.ts
 * - Middleware applied in AppModule.configure()
 */
@Module({
  imports: [
    // Configuration module must be first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core database module (global)
    PrismaModule,

    // Application config module
    AppConfigModule,
    CommonServicesModule,

    // Register JwtModule at root so JwtService is available across modules
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getJwtSecret(),
        signOptions: { expiresIn: appConfig.getJwtAccessTokenExpires() as any },
      }),
      inject: [AppConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    AdminModule,
    NotificationModule,
    SystemSettingModule,
    UploadModule,
    AppInitModule,
    UsageModule,
    RewardModule,
    RewardChatModule,
    SettingsModule,
    TrackModule,
    ApiLogModule,
    SubscriptionApiModule,
    VpsModule,
    ProjectsModule,
    InfrastructureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware (executed in order of application).
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
