import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus, USAGE_LIMITS } from '../../common/constants';

const MAX_FREE_CHAT_PER_DAY = USAGE_LIMITS.MAX_FREE_CHAT_PER_DAY;
const CHAT_BONUS_PER_AD = USAGE_LIMITS.CHAT_BONUS_PER_AD;

@Injectable()
export class RewardChatService {
  private readonly logger = new Logger('RewardChatService');

  constructor(private prisma: PrismaService) {}

  private getTodayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  /**
   * POST /reward-chat/ads
   * Award bonus AI chat turns after user watches an ad.
   */
  async rewardAds(userId: string): Promise<{ chatRemaining: number }> {
    this.logger.log(`Reward chat ads for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, endDate: true },
    });

    const isPremium =
      !!user?.isPremium &&
      subscription?.status === SubscriptionStatus.ACTIVE &&
      (subscription.endDate ? subscription.endDate > new Date() : true);

    if (isPremium) {
      return { chatRemaining: 999 };
    }

    await this.prisma.createAuditLog({
      action: 'REWARD_CHAT_ADS',
      entityType: 'Chat',
      entityId: userId,
      userId,
      changes: {
        bonusTurns: CHAT_BONUS_PER_AD,
      },
    });

    const { start, end } = this.getTodayRange();

    const [usedToday, rewardedToday] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'QUOTA_CHAT_USED',
          createdAt: { gte: start, lt: end },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'REWARD_CHAT_ADS',
          createdAt: { gte: start, lt: end },
        },
      }),
    ]);

    const totalAllowed = MAX_FREE_CHAT_PER_DAY + rewardedToday * CHAT_BONUS_PER_AD;
    const chatRemaining = Math.max(0, totalAllowed - usedToday);

    return { chatRemaining };
  }

  /**
   * Ghi nhận 1 lượt chat đã dùng — business module (chat/AI) tương lai gọi method
   * này qua DI mỗi khi user dùng hết 1 lượt, để app-init.calculateChatRemaining
   * đếm đúng quota còn lại trong ngày.
   */
  async recordChatUsed(userId: string): Promise<void> {
    await this.prisma.createAuditLog({
      action: 'QUOTA_CHAT_USED',
      entityType: 'Chat',
      entityId: userId,
      userId,
    });
  }
}
