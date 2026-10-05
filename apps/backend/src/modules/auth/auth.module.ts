import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppConfigService } from '../../config/app-config.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

/**
 * AuthModule
 *
 * Authentication feature module.
 * Handles user registration, login, token generation, and refresh.
 *
 * Dependencies:
 * - JwtModule: For JWT token creation and verification
 * - PrismaModule: For database access
 * - AppConfigService: For reading configuration
 *
 * Exports:
 * - AuthService: Available to other modules
 * - AuthController: Exposes /auth endpoints
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getJwtSecret(),
        signOptions: { expiresIn: appConfig.getJwtAccessTokenExpires() as any },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
