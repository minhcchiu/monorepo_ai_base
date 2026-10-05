import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

import { AdminSystemSettingsController } from './admin-system-settings.controller';
import { AdminSystemSettingsService } from './admin-system-settings.service';

import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [
    AdminUsersController,
    AdminSystemSettingsController,
    AdminDashboardController,
    AdminNotificationsController,
    AdminSubscriptionsController,
  ],
  providers: [
    AdminUsersService,
    AdminSystemSettingsService,
    AdminDashboardService,
    AdminNotificationsService,
    AdminSubscriptionsService,
  ],
  exports: [AdminUsersService, AdminNotificationsService],
})
export class AdminModule {}
