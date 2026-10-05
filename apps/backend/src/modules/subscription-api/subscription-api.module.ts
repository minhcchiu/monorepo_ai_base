import { Module } from '@nestjs/common';
import { SubscriptionApiController } from './subscription-api.controller';
import { SubscriptionApiService } from './subscription-api.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionApiController],
  providers: [SubscriptionApiService],
})
export class SubscriptionApiModule {}
