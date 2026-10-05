import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AppInitService } from './app-init.service';
import { AppInitRequestDto, AppInitResponseDto } from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { ApiScope, CurrentUserId } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';

@Controller('app')
@ApiTags('App')
@ApiScope('app')
export class AppInitController {
  private readonly logger = new Logger('AppInitController');

  constructor(private appInitService: AppInitService) {}

  /**
   * POST /app/init
   * Gọi 1 lần khi mở app. Trả trạng thái premium, quota còn lại, cờ hiện paywall, remote config.
   */
  @UseGuards(JwtAuthGuard)
  @Post('init')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize app state on launch' })
  @ApiBody({ type: AppInitRequestDto })
  @ApiResponse({ status: 200, description: 'App initialized', type: AppInitResponseDto })
  async init(
    @Body() _dto: AppInitRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<AppInitResponseDto>> {
    this.logger.log(`App init for user: ${userId}`);
    const data = await this.appInitService.initApp(userId);
    return BaseResponseDto.success('App initialized', data);
  }
}
