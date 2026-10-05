import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FirebaseMessagingService } from './firebase-messaging.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseMessagingService],
  exports: [NotificationService],
})
export class NotificationModule {}
