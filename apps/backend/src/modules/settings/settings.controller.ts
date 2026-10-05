import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { ApiScope, CurrentUserId } from '../../common/decorators';

@Controller('settings')
@ApiTags('Settings')
@ApiBearerAuth()
@ApiScope('app')
export class SettingsController {
  private readonly logger = new Logger('SettingsController');

  constructor(private settingsService: SettingsService) {}

  /** POST /settings/update */
  @UseGuards(JwtAuthGuard)
  @Post('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user settings (language, unit, notificationsEnabled)' })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<{ success: boolean }>> {
    this.logger.log(`Update settings for user: ${userId}`);
    const data = await this.settingsService.updateSettings(userId, dto);
    return BaseResponseDto.success('Settings updated', data);
  }
}
