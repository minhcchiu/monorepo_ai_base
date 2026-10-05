import { Controller, Post, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardChatService } from './reward-chat.service';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { ApiScope, CurrentUserId } from '../../common/decorators';

@Controller('reward-chat')
@ApiTags('Reward Chat')
@ApiBearerAuth()
@ApiScope('app')
export class RewardChatController {
  private readonly logger = new Logger('RewardChatController');

  constructor(private rewardChatService: RewardChatService) {}

  /** POST /reward-chat/ads — Earn bonus AI chat turns from watching an ad */
  @UseGuards(JwtAuthGuard)
  @Post('ads')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Earn bonus AI chat turns from watching an ad' })
  @ApiResponse({ status: 200, description: 'Chat ad reward granted' })
  async rewardAds(
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<{ chatRemaining: number }>> {
    this.logger.log(`Chat ads reward for user: ${userId}`);
    const data = await this.rewardChatService.rewardAds(userId);
    return BaseResponseDto.success('Chat ad reward granted', data);
  }
}
