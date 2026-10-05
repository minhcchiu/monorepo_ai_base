import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TrackService } from './track.service';
import { TrackEventDto } from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { ApiScope, CurrentUserId } from '../../common/decorators';

@Controller('track')
@ApiTags('Track')
@ApiBearerAuth()
@ApiScope('app')
export class TrackController {
  private readonly logger = new Logger('TrackController');

  constructor(private trackService: TrackService) {}

  /** POST /track/event */
  @UseGuards(JwtAuthGuard)
  @Post('event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiBody({ type: TrackEventDto })
  @ApiResponse({ status: 200, description: 'Event tracked' })
  async trackEvent(
    @Body() dto: TrackEventDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<{ success: boolean }>> {
    this.logger.log(`Track event for user: ${userId}`);
    const data = await this.trackService.trackEvent(userId, dto.event, dto.metadata);
    return BaseResponseDto.success('Event tracked', data);
  }
}
