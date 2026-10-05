import { Controller, Post, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardService } from './reward.service';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { ApiScope, CurrentUserId } from '../../common/decorators';

@Controller('reward')
@ApiTags('Reward')
@ApiBearerAuth()
@ApiScope('app')
export class RewardController {
  private readonly logger = new Logger('RewardController');

  constructor(private rewardService: RewardService) {}

  /** POST /reward/daily — Claim daily bonus action */
  @UseGuards(JwtAuthGuard)
  @Post('daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim daily reward (free bonus action)' })
  @ApiResponse({ status: 200, description: 'Reward claimed, remaining actions returned' })
  @ApiResponse({ status: 400, description: 'Daily reward already claimed' })
  async claimDaily(
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<{ remainingAction: number }>> {
    this.logger.log(`Daily reward for user: ${userId}`);
    const data = await this.rewardService.claimDaily(userId);
    return BaseResponseDto.success('Daily reward claimed', data);
  }

  /** POST /reward/ads — Earn bonus action from watching an ad */
  @UseGuards(JwtAuthGuard)
  @Post('ads')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Earn bonus action from watching an ad' })
  @ApiResponse({ status: 200, description: 'Ad reward granted' })
  async rewardAds(
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<{ remainingAction: number }>> {
    this.logger.log(`Ads reward for user: ${userId}`);
    const data = await this.rewardService.rewardAds(userId);
    return BaseResponseDto.success('Ad reward granted', data);
  }
}
