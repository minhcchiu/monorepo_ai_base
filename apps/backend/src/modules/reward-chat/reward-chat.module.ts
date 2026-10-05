import { Module } from '@nestjs/common';
import { RewardChatController } from './reward-chat.controller';
import { RewardChatService } from './reward-chat.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RewardChatController],
  providers: [RewardChatService],
  exports: [RewardChatService],
})
export class RewardChatModule {}
