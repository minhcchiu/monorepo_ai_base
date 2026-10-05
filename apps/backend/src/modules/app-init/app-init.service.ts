import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus, USAGE_LIMITS } from '../../common/constants';

const MAX_FREE_ACTIONS_PER_DAY = USAGE_LIMITS.MAX_FREE_ACTIONS_PER_DAY;
const MAX_FREE_CHAT_PER_DAY = USAGE_LIMITS.MAX_FREE_CHAT_PER_DAY;
const CHAT_BONUS_PER_AD = USAGE_LIMITS.CHAT_BONUS_PER_AD;

@Injectable()
export class AppInitService {
  private readonly logger = new Logger('AppInitService');

  constructor(private prisma: PrismaService) {}

  async initApp(userId: string): Promise<{
    isFirstInstall: boolean;
    isPremium: boolean;
    actionRemaining: number;
    chatRemaining: number;
    showPaywall: boolean;
    remoteConfig: { maxFreeAction: number; maxFreeChat: number; adsEnabled: boolean };
  }> {
    this.logger.log(`App init for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, isPremium: true },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, endDate: true, plan: true },
    });

    const isPremium =
      !!user?.isPremium &&
      subscription?.status === SubscriptionStatus.ACTIVE &&
      (subscription.endDate ? subscription.endDate > new Date() : true);

    const actionRemaining = await this.calculateActionRemaining(userId, isPremium);
    const chatRemaining = await this.calculateChatRemaining(userId, isPremium);

    const isFirstInstall = this.isFirstInstall(user?.createdAt);

    return {
      isFirstInstall,
      isPremium,
      actionRemaining,
      chatRemaining,
      showPaywall: !isPremium,
      remoteConfig: {
        maxFreeAction: MAX_FREE_ACTIONS_PER_DAY,
        maxFreeChat: MAX_FREE_CHAT_PER_DAY,
        adsEnabled: !isPremium,
      },
    };
  }

  private isSameDay(date1: Date | null | undefined, date2: Date): boolean {
    if (!date1) return false;
    const d1 = new Date(date1);
    return (
      d1.getFullYear() === date2.getFullYear() &&
      d1.getMonth() === date2.getMonth() &&
      d1.getDate() === date2.getDate()
    );
  }

  private getTodayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  private async calculateChatRemaining(userId: string, isPremium: boolean): Promise<number> {
    if (isPremium) return 999;

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
    return Math.max(0, totalAllowed - usedToday);
  }

  private isFirstInstall(createdAt?: Date): boolean {
    if (!createdAt) return false;
    const diffMs = Date.now() - createdAt.getTime();
    return diffMs < 2 * 60 * 1000;
  }

  /**
   * Đếm hành động miễn phí còn lại trong ngày dựa vào Usage.actionCount/lastActionDate
   * (reset-by-computation — không cron reset, xem RewardService.getRemainingFromUsage
   * ở module reward dùng cùng cơ chế). Base không có bảng nghiệp vụ nào tự ghi nhận
   * "hành động" — sản phẩm cụ thể gọi PATCH /usage/:userId/increment-actions mỗi khi
   * user thực hiện 1 hành động tốn quota.
   */
  private async calculateActionRemaining(userId: string, isPremium: boolean): Promise<number> {
    if (isPremium) return 999;

    const usage = await this.prisma.usage.findUnique({
      where: { userId },
      select: { actionCount: true, rewardCount: true, lastActionDate: true },
    });

    const today = new Date();
    const usedToday = this.isSameDay(usage?.lastActionDate ?? null, today)
      ? (usage?.actionCount ?? 0)
      : 0;
    const bonusActions = usage?.rewardCount ?? 0;

    return Math.max(0, MAX_FREE_ACTIONS_PER_DAY + bonusActions - usedToday);
  }
}
