import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { USAGE_LIMITS } from '../../common/constants';

const MAX_FREE_ACTIONS_PER_DAY = USAGE_LIMITS.MAX_FREE_ACTIONS_PER_DAY;
const REWARD_BONUS_ACTIONS = 1;

@Injectable()
export class RewardService {
  private readonly logger = new Logger('RewardService');

  constructor(private prisma: PrismaService) {}

  private isSameDay(date1: Date | null | undefined, date2: Date): boolean {
    if (!date1) return false;
    const d1 = new Date(date1);
    return (
      d1.getFullYear() === date2.getFullYear() &&
      d1.getMonth() === date2.getMonth() &&
      d1.getDate() === date2.getDate()
    );
  }

  private getRemainingFromUsage(
    actionCount: number,
    rewardCount: number,
    lastActionDate: Date | null,
  ): number {
    const today = new Date();
    const usedToday = this.isSameDay(lastActionDate, today) ? actionCount : 0;
    return Math.max(0, MAX_FREE_ACTIONS_PER_DAY + rewardCount - usedToday);
  }

  /**
   * POST /reward/daily
   * Claim one free bonus action per day.
   */
  async claimDaily(userId: string) {
    this.logger.log(`Daily reward for user: ${userId}`);

    const today = new Date();
    const usage = await this.prisma.usage.findUnique({ where: { userId } });

    if (usage && this.isSameDay(usage.lastActionDate, today) && usage.rewardCount > 0) {
      throw new BadRequestException('Daily reward already claimed today');
    }

    const updated = await this.prisma.usage.upsert({
      where: { userId },
      create: {
        userId,
        actionCount: 0,
        lastActionDate: today,
        rewardCount: REWARD_BONUS_ACTIONS,
      },
      update: {
        rewardCount: { increment: REWARD_BONUS_ACTIONS },
        lastActionDate: today,
      },
    });

    const remainingAction = this.getRemainingFromUsage(
      updated.actionCount,
      updated.rewardCount,
      updated.lastActionDate,
    );

    return { remainingAction };
  }

  /**
   * POST /reward/ads
   * Award bonus action for watching an ad.
   */
  async rewardAds(userId: string) {
    this.logger.log(`Ads reward for user: ${userId}`);

    const today = new Date();

    const updated = await this.prisma.usage.upsert({
      where: { userId },
      create: {
        userId,
        actionCount: 0,
        lastActionDate: today,
        rewardCount: REWARD_BONUS_ACTIONS,
      },
      update: {
        rewardCount: { increment: REWARD_BONUS_ACTIONS },
      },
    });

    const remainingAction = this.getRemainingFromUsage(
      updated.actionCount,
      updated.rewardCount,
      updated.lastActionDate,
    );

    return { remainingAction };
  }
}
