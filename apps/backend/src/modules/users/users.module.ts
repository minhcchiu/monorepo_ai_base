import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserPhoneController } from './user-phone.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppConfigService } from '../../config/app-config.service';

/**
 * UsersModule
 *
 * User management feature module.
 * Handles CRUD operations for users with pagination, soft delete support.
 *
 * Dependencies:
 * - PrismaModule: For database access
 *
 * Endpoints:
 * - GET /users - List users
 * - GET /users/search - Search users
 * - GET /users/:id - Get user
 * - POST /users - Create user (admin)
 * - PATCH /users/:id - Update user
 * - DELETE /users/:id - Delete user (admin)
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getJwtSecret(),
        signOptions: { expiresIn: appConfig.getJwtAccessTokenExpires() as any },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [UsersController, UserPhoneController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
