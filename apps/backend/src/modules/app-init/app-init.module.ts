import { Module } from '@nestjs/common';
import { AppInitController } from './app-init.controller';
import { AppInitService } from './app-init.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppInitController],
  providers: [AppInitService],
})
export class AppInitModule {}
