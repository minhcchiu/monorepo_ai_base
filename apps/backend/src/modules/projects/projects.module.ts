import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { GlobalProjectsController } from './global-projects.controller';
import { ProjectsService } from './projects.service';
import { VpsModule } from '../vps/vps.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, VpsModule],
  controllers: [ProjectsController, GlobalProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
