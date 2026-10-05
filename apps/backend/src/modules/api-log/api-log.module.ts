import { Module } from '@nestjs/common';
import { ApiLogController } from './api-log.controller';
import { ApiLogService } from './api-log.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ApiLogCleanupService } from './api-log-cleanup.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiLogController],
  providers: [ApiLogService, ApiLogCleanupService],
})
export class ApiLogModule {}
