import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppConfigService } from './app-config.service';

/**
 * AppConfigModule
 *
 * Global configuration module that loads environment variables.
 * Provides AppConfigService for type-safe access to configuration.
 *
 * Features:
 * - Environment-specific configuration
 * - Type-safe config access
 * - Validation on startup
 * - Global availability
 *
 * Usage:
 * @Injectable()
 * export class MyService {
 *   constructor(private appConfig: AppConfigService) {}
 *
 *   someMethod() {
 *     const dbUrl = this.appConfig.getDatabaseUrl();
 *     const port = this.appConfig.getPort();
 *   }
 * }
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      // Load .env file - supports .env.local for local development
      envFilePath: [join(process.cwd(), '.env.local'), join(process.cwd(), '.env')],
      isGlobal: true, // Makes ConfigService available globally
      expandVariables: true, // Allows $VARIABLE interpolation
      cache: true, // Cache loaded environment variables
      // Use `validate` or `validationSchema` + `validationOptions` for custom validation handling
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
