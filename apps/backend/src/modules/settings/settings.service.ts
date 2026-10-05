import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Language, Unit } from '../../common/constants';

interface UpdateSettingsData {
  language?: Language;
  unit?: Unit;
  notificationsEnabled?: boolean;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger('SettingsService');

  constructor(private prisma: PrismaService) {}

  /** POST /settings/update */
  async updateSettings(userId: string, data: UpdateSettingsData) {
    this.logger.log(`Update settings for user: ${userId}`);

    const updateData: Record<string, any> = {};
    if (data.language !== undefined) updateData.language = data.language;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.notificationsEnabled !== undefined)
      updateData.notificationsEnabled = data.notificationsEnabled;

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true };
  }
}
