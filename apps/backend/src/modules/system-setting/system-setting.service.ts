import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';

@Injectable()
export class SystemSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSystemSettingDto) {
    return this.prisma.systemSetting.create({ data: dto as any });
  }

  async findAll(query: any) {
    const page = Number(query.page || 1);
    const limit = Math.min(Number(query.limit || 20), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.key) where.key = { contains: query.key };

    const [items, total] = await Promise.all([
      this.prisma.systemSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemSetting.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const item = await this.prisma.systemSetting.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('SystemSetting not found');
    return item;
  }

  async update(id: string, dto: UpdateSystemSettingDto) {
    await this.findOne(id);
    return this.prisma.systemSetting.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.systemSetting.delete({ where: { id } });
  }
}
