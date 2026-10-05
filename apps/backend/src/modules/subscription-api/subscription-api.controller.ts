import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionApiService } from './subscription-api.service';
import {
  VerifyPurchaseDto,
  VerifyPurchaseResponseDto,
  SubscriptionStatusResponseDto,
  RestorePurchaseDto,
  RestorePurchaseResponseDto,
  SyncPurchaseDto,
  SyncPurchaseResponseDto,
} from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard, RoleGuard } from '../../common/guards';
import { ApiScope, CurrentUserId, Public, Roles } from '../../common/decorators';

@Controller('subscription')
@ApiTags('Subscription')
@ApiBearerAuth()
export class SubscriptionApiController {
  private readonly logger = new Logger('SubscriptionApiController');

  constructor(private subscriptionApiService: SubscriptionApiService) {}

  /** POST /subscription/verify */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Google purchase and activate subscription' })
  @ApiBody({ type: VerifyPurchaseDto })
  @ApiResponse({ status: 200, description: 'Purchase verified', type: VerifyPurchaseResponseDto })
  async verify(
    @Body() dto: VerifyPurchaseDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<VerifyPurchaseResponseDto>> {
    this.logger.log(`Verify purchase for user: ${userId}`);
    const data = await this.subscriptionApiService.verifyPurchase(userId, dto);
    return BaseResponseDto.success('Purchase verified successfully', data);
  }

  /** GET /subscription/status?sync=true */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiQuery({
    name: 'sync',
    required: false,
    description: 'true để buộc verify lại với Google Play thay vì đọc cache DB',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription status returned',
    type: SubscriptionStatusResponseDto,
  })
  async getStatus(
    @CurrentUserId() userId: string,
    @Query('sync') sync?: string,
  ): Promise<BaseResponseDto<SubscriptionStatusResponseDto>> {
    this.logger.log(`Get subscription status`);
    const data = await this.subscriptionApiService.getStatus(userId, sync === 'true');
    return BaseResponseDto.success('Subscription status retrieved', data);
  }

  /** POST /subscription/restore */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore purchase and activate subscription' })
  @ApiBody({ type: RestorePurchaseDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription restored',
    type: RestorePurchaseResponseDto,
  })
  async restore(
    @Body() dto: RestorePurchaseDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<RestorePurchaseResponseDto>> {
    this.logger.log(`Restore subscription`);
    const data = await this.subscriptionApiService.restorePurchase(userId, dto);
    return BaseResponseDto.success('Subscription restore completed', data);
  }

  /** POST /subscription/webhook/google */
  // TODO: this endpoint is @Public() and accepts any POST body with no authenticity check —
  // it does not verify the Pub/Sub push subscription's `Authorization: Bearer` OIDC token,
  // nor does it cross-check the decoded payload's packageName against GOOGLE_PLAY_PACKAGE_NAME.
  // Add Pub/Sub push endpoint authentication before production launch (see
  // https://cloud.google.com/pubsub/docs/push#validate_tokens).
  @Public()
  @Post('webhook/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Google subscription webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async webhookGoogle(@Body() payload: any): Promise<BaseResponseDto<{ received: boolean }>> {
    this.logger.log('Google webhook received');
    const data = await this.subscriptionApiService.handleGoogleWebhook(payload);
    return BaseResponseDto.success('Webhook received', data);
  }

  /** POST /subscription/sync */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiScope('admin')
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manual sync subscription state from Google' })
  @ApiBody({ type: SyncPurchaseDto })
  @ApiResponse({ status: 200, description: 'Subscription synced', type: SyncPurchaseResponseDto })
  async sync(
    @Body() dto: SyncPurchaseDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<SyncPurchaseResponseDto>> {
    this.logger.log(`Manual sync for user: ${userId}`);
    const data = await this.subscriptionApiService.syncPurchase(userId, dto);
    return BaseResponseDto.success('Subscription synced successfully', data);
  }
}
