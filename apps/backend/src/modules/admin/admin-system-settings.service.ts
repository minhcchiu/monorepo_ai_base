import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuerySystemSettingsDto } from './dto/query-system-settings.dto';
import { AdminCreateSystemSettingDto } from './dto/create-system-setting.dto';
import { AdminUpdateSystemSettingDto } from './dto/update-system-setting.dto';

@Injectable()
export class AdminSystemSettingsService {
  private readonly logger = new Logger('AdminSystemSettingsService');

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySystemSettingsDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.key = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.systemSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.systemSetting.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`System setting '${key}' not found`);
    return setting;
  }

  async create(dto: AdminCreateSystemSettingDto, adminId: string) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key: dto.key } });
    if (existing) throw new ConflictException(`Setting key '${dto.key}' already exists`);

    const setting = await this.prisma.systemSetting.create({
      data: { key: dto.key, value: dto.value, description: dto.description },
      select: { id: true, key: true, value: true, createdAt: true },
    });

    await this.prisma.createAuditLog({
      action: 'SYSTEM_SETTING_CREATE',
      entityType: 'SystemSetting',
      entityId: setting.id,
      userId: adminId,
      changes: { key: dto.key },
    });

    this.logger.log(`Admin ${adminId} created system setting '${dto.key}'`);
    return setting;
  }

  async update(key: string, dto: AdminUpdateSystemSettingDto, adminId: string) {
    const existing = await this.findByKey(key);

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value: dto.value,
        ...(dto.description !== undefined && { description: dto.description }),
      },
      select: { id: true, key: true, value: true, updatedAt: true },
    });

    await this.prisma.createAuditLog({
      action: 'SYSTEM_SETTING_UPDATE',
      entityType: 'SystemSetting',
      entityId: existing.id,
      userId: adminId,
      changes: dto,
    });

    return updated;
  }

  async remove(key: string, adminId: string) {
    const existing = await this.findByKey(key);

    await this.prisma.systemSetting.delete({ where: { key } });

    await this.prisma.createAuditLog({
      action: 'SYSTEM_SETTING_DELETE',
      entityType: 'SystemSetting',
      entityId: existing.id,
      userId: adminId,
    });

    this.logger.log(`Admin ${adminId} deleted system setting '${key}'`);
  }
}
