import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform, PlanType, PurchaseStatus, SubscriptionStatus } from '../../common/constants';
import {
  RestorePurchaseDto,
  SubscriptionStatusResponseDto,
  SyncPurchaseDto,
  SyncPurchaseResponseDto,
  VerifyPurchaseDto,
  VerifyPurchaseResponseDto,
} from './dto';

type GoogleVerificationResult = {
  platform: Platform;
  productId: string;
  purchaseToken: string;
  orderId: string | null;
  plan: PlanType;
  isTrial: boolean;
  autoRenew: boolean;
  purchaseTime: Date;
  expiresAt: Date | null;
  purchaseStatus: PurchaseStatus;
  acknowledged: boolean;
  rawData: Record<string, any>;
};

type ParsedGoogleWebhook = {
  kind: 'subscription' | 'test' | 'voided' | 'one_time' | 'unknown';
  eventType: string;
  platform: Platform;
  productId: string;
  purchaseToken: string;
  packageName?: string;
  orderId?: string;
  rawData: Record<string, any>;
};

@Injectable()
export class SubscriptionApiService {
  private readonly logger = new Logger('SubscriptionApiService');

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getGooglePlayConfig(): { keyFile: string; packageName: string } {
    const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const packageName = this.configService.get<string>('GOOGLE_PLAY_PACKAGE_NAME');

    if (!credentialsPath) {
      throw new BadRequestException('Missing GOOGLE_APPLICATION_CREDENTIALS');
    }
    if (!packageName) {
      throw new BadRequestException('Missing GOOGLE_PLAY_PACKAGE_NAME');
    }

    const keyFile = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);

    return { keyFile, packageName };
  }

  private async getAndroidPublisherAccessToken(keyFile: string): Promise<string> {
    const auth = new GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const client = await auth.getClient();
    const tokenResult = await client.getAccessToken();
    const accessToken = typeof tokenResult === 'string' ? tokenResult : tokenResult?.token;

    if (!accessToken) {
      throw new BadRequestException('Cannot obtain Google Android Publisher access token');
    }

    return accessToken;
  }

  private async acknowledgeGoogleSubscriptionIfNeeded(params: {
    packageName: string;
    productId: string;
    purchaseToken: string;
    accessToken: string;
    acknowledgementState?: string;
    isWebhook?: boolean;
  }): Promise<boolean> {
    const {
      packageName,
      productId,
      purchaseToken,
      accessToken,
      acknowledgementState,
      isWebhook = false,
    } = params;

    if (acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
      return true;
    }

    const acknowledgeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      packageName,
    )}/purchases/subscriptions/${encodeURIComponent(
      productId,
    )}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;

    const response = await fetch(acknowledgeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ developerPayload: 'verified-by-backend' }),
    });

    if (response.ok) {
      return true;
    }

    const errorText = await response.text();
    if (errorText.toLowerCase().includes('already acknowledged')) {
      return true;
    }

    // For webhooks, handle productNotOwnedByUser gracefully and continue processing
    if (isWebhook && errorText.toLowerCase().includes('productnotownedbyuser')) {
      this.logger.warn(
        `Google Play acknowledge skipped for webhook (product not owned by user): ${purchaseToken}`,
      );
      return false;
    }

    this.logger.error(`Google Play acknowledge failed: ${response.status} ${response.statusText}`);
    throw new BadRequestException(`Google Play acknowledge failed: ${errorText}`);
  }

  private mapProductIdToPlan(productId: string): PlanType {
    const normalized = productId.toLowerCase();
    if (normalized.includes('week')) return PlanType.WEEKLY;
    if (normalized.includes('year')) return PlanType.YEARLY;
    throw new BadRequestException(`Unsupported productId: ${productId}`);
  }

  private toSubscriptionStatus(
    purchaseStatus: PurchaseStatus,
    expiresAt: Date | null,
    autoRenew: boolean,
  ): SubscriptionStatus {
    const now = new Date();

    if (purchaseStatus === PurchaseStatus.REVOKED) {
      return SubscriptionStatus.CANCELED;
    }

    if (purchaseStatus === PurchaseStatus.CANCELED) {
      if (expiresAt && expiresAt > now) {
        return SubscriptionStatus.GRACE;
      }
      return SubscriptionStatus.EXPIRED;
    }

    if (purchaseStatus === PurchaseStatus.EXPIRED) {
      return SubscriptionStatus.EXPIRED;
    }

    if (expiresAt && expiresAt <= now) {
      return SubscriptionStatus.EXPIRED;
    }

    if (!autoRenew && expiresAt && expiresAt > now) {
      return SubscriptionStatus.GRACE;
    }

    return SubscriptionStatus.ACTIVE;
  }

  private isPremiumByState(
    status: SubscriptionStatus | null | undefined,
    expiresAt: Date | null | undefined,
  ): boolean {
    if (!status) return false;
    if (status !== SubscriptionStatus.ACTIVE && status !== SubscriptionStatus.GRACE) {
      return false;
    }
    return expiresAt ? expiresAt > new Date() : false;
  }

  private getEffectiveAutoRenew(
    purchaseStatus: PurchaseStatus,
    autoRenewFromGoogle: boolean,
  ): boolean {
    // When subscription is canceled, revoked, or expired, autoRenew must be false
    // regardless of what Google reports (Google might keep it true to indicate previous state)
    if (
      purchaseStatus === PurchaseStatus.CANCELED ||
      purchaseStatus === PurchaseStatus.REVOKED ||
      purchaseStatus === PurchaseStatus.EXPIRED
    ) {
      return false;
    }
    return autoRenewFromGoogle;
  }

  private async verifyGooglePurchase(
    payload: VerifyPurchaseDto | RestorePurchaseDto | SyncPurchaseDto,
    platform: Platform,
    isWebhook: boolean = false,
  ): Promise<GoogleVerificationResult> {
    if (platform !== Platform.ANDROID) {
      throw new BadRequestException('IOS verification not yet implemented. Please use ANDROID.');
    }

    const { keyFile, packageName } = this.getGooglePlayConfig();
    const accessToken = await this.getAndroidPublisherAccessToken(keyFile);

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      packageName,
    )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(payload.purchaseToken)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Google Play verify failed: ${response.status} ${response.statusText}`);
      throw new BadRequestException(`Google Play verification failed: ${errorText}`);
    }

    const googleData = await response.json();
    const lineItem = googleData?.lineItems?.[0];

    if (!lineItem) {
      throw new BadRequestException('Google Play response missing lineItems');
    }

    const plan = this.mapProductIdToPlan(payload.productId);
    const expiresAt = lineItem.expiryTime ? new Date(lineItem.expiryTime) : null;
    const purchaseTime = lineItem.startTime ? new Date(lineItem.startTime) : new Date();
    const autoRenew = lineItem.autoRenewingPlan?.autoRenewEnabled ?? false;
    const purchaseStatus = this.mapGoogleSubscriptionStateToPurchaseStatus(
      googleData.subscriptionState,
    );

    const offerId =
      typeof lineItem.offerDetails?.offerId === 'string'
        ? lineItem.offerDetails.offerId.toLowerCase()
        : '';
    const offerTags = Array.isArray(lineItem.offerDetails?.offerTags)
      ? lineItem.offerDetails.offerTags.map((x: unknown) => String(x).toLowerCase()).join(',')
      : '';
    const isTrial = offerId.includes('trial') || offerTags.includes('trial');

    const orderId = googleData.latestOrderId ?? lineItem.latestSuccessfulOrderId ?? null;

    const acknowledged = await this.acknowledgeGoogleSubscriptionIfNeeded({
      packageName,
      productId: payload.productId,
      purchaseToken: payload.purchaseToken,
      accessToken,
      acknowledgementState: lineItem.acknowledgementState,
      isWebhook,
    });

    return {
      platform,
      productId: payload.productId,
      purchaseToken: payload.purchaseToken,
      orderId,
      plan,
      isTrial,
      autoRenew,
      purchaseTime,
      expiresAt,
      purchaseStatus,
      acknowledged,
      rawData: googleData,
    };
  }

  private async upsertSubscriptionAndPurchase(
    userId: string,
    verification: GoogleVerificationResult,
  ) {
    const subStatus = this.toSubscriptionStatus(
      verification.purchaseStatus,
      verification.expiresAt,
      verification.autoRenew,
    );
    const isPremium = this.isPremiumByState(subStatus, verification.expiresAt);

    // When subscription is canceled, revoked, or expired, autoRenew must be false
    const effectiveAutoRenew = this.getEffectiveAutoRenew(
      verification.purchaseStatus,
      verification.autoRenew,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.purchase.upsert({
        where: { purchaseToken: verification.purchaseToken },
        create: {
          userId,
          platform: verification.platform,
          productId: verification.productId,
          purchaseToken: verification.purchaseToken,
          orderId: verification.orderId,
          isTrial: verification.isTrial,
          purchaseTime: verification.purchaseTime,
          expiresAt: verification.expiresAt,
          status: verification.purchaseStatus,
          rawData: {
            ...verification.rawData,
            acknowledged: verification.acknowledged,
          },
        },
        update: {
          userId,
          platform: verification.platform,
          productId: verification.productId,
          orderId: verification.orderId,
          isTrial: verification.isTrial,
          purchaseTime: verification.purchaseTime,
          expiresAt: verification.expiresAt,
          status: verification.purchaseStatus,
          rawData: {
            ...verification.rawData,
            acknowledged: verification.acknowledged,
          },
        },
      });

      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          platform: verification.platform,
          plan: verification.plan,
          status: subStatus,
          isTrial: verification.isTrial,
          startDate: verification.purchaseTime,
          endDate: verification.expiresAt,
          expiresAt: verification.expiresAt,
          purchaseToken: verification.purchaseToken,
          orderId: verification.orderId,
          autoRenew: effectiveAutoRenew,
        },
        update: {
          platform: verification.platform,
          plan: verification.plan,
          status: subStatus,
          isTrial: verification.isTrial,
          endDate: verification.expiresAt,
          expiresAt: verification.expiresAt,
          purchaseToken: verification.purchaseToken,
          orderId: verification.orderId,
          autoRenew: effectiveAutoRenew,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isPremium },
      });

      await tx.auditLog.create({
        data: {
          action: 'SUBSCRIPTION_VERIFY',
          entityType: 'Subscription',
          entityId: userId,
          userId,
          changes: {
            status: subStatus,
            plan: verification.plan,
            isTrial: verification.isTrial,
            expiresAt: verification.expiresAt,
            autoRenew: effectiveAutoRenew,
            acknowledged: verification.acknowledged,
          },
        },
      });
    });

    return {
      isPremium,
      plan: verification.plan,
      isTrial: verification.isTrial,
      expiresAt: verification.expiresAt,
      autoRenew: effectiveAutoRenew,
      status: subStatus,
    };
  }

  /** POST /subscription/verify */
  async verifyPurchase(userId: string, dto: VerifyPurchaseDto): Promise<VerifyPurchaseResponseDto> {
    this.logger.log(`Verify purchase for user: ${userId}`);

    const verification = await this.verifyGooglePurchase(dto, dto.platform);
    const state = await this.upsertSubscriptionAndPurchase(userId, verification);

    return {
      isPremium: state.isPremium,
      plan: state.plan,
      isTrial: state.isTrial,
      expiresAt: state.expiresAt,
      autoRenew: state.autoRenew,
    };
  }

  /** GET /subscription/status */
  async getStatus(userId: string, forceSync = false): Promise<SubscriptionStatusResponseDto> {
    this.logger.log(`Get subscription status for user: ${userId}`);

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        platform: true,
        status: true,
        plan: true,
        isTrial: true,
        expiresAt: true,
        autoRenew: true,
        purchaseToken: true,
      },
    });

    // Tự sync khi: (a) client/admin buộc qua ?sync=true, hoặc (b) subscription local
    // vừa hết hạn nhưng autoRenew=true (tránh premium status bị cũ so với Google).
    const staleExpired = !!(sub?.autoRenew && sub.expiresAt && sub.expiresAt <= new Date());
    if ((forceSync || staleExpired) && sub?.platform === Platform.ANDROID && sub.purchaseToken) {
      const purchase = await this.prisma.purchase.findUnique({
        where: { purchaseToken: sub.purchaseToken },
        select: { productId: true },
      });

      if (purchase?.productId) {
        try {
          const verification = await this.verifyGooglePurchase(
            {
              productId: purchase.productId,
              purchaseToken: sub.purchaseToken,
            },
            Platform.ANDROID,
          );
          const state = await this.upsertSubscriptionAndPurchase(userId, verification);

          return {
            isPremium: state.isPremium,
            plan: state.plan,
            isTrial: state.isTrial,
            expiresAt: state.expiresAt,
            autoRenew: state.autoRenew,
            status: state.status,
          };
        } catch (error) {
          this.logger.warn(
            `Subscription status auto-sync failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    const isPremium = this.isPremiumByState(sub?.status, sub?.expiresAt);

    return {
      isPremium,
      plan: sub?.plan ?? null,
      isTrial: sub?.isTrial ?? false,
      expiresAt: sub?.expiresAt ?? null,
      autoRenew: sub?.autoRenew ?? false,
      status: sub?.status ?? null,
    };
  }

  /** POST /subscription/restore */
  async restorePurchase(
    userId: string,
    dto: RestorePurchaseDto,
  ): Promise<{ isPremium: boolean; expiresAt: Date | null }> {
    this.logger.log(`Restore subscription for user: ${userId}`);

    const verification = await this.verifyGooglePurchase(dto, Platform.ANDROID);
    const state = await this.upsertSubscriptionAndPurchase(userId, verification);

    await this.prisma.createAuditLog({
      action: 'SUBSCRIPTION_RESTORE',
      entityType: 'Subscription',
      entityId: userId,
      userId,
      changes: {
        purchaseToken: dto.purchaseToken,
        productId: dto.productId,
      },
    });

    return { isPremium: state.isPremium, expiresAt: state.expiresAt };
  }

  /** POST /subscription/sync */
  async syncPurchase(adminUserId: string, dto: SyncPurchaseDto): Promise<SyncPurchaseResponseDto> {
    this.logger.log(`Manual sync by admin: ${adminUserId}`);

    const purchase = await this.prisma.purchase.findUnique({
      where: { purchaseToken: dto.purchaseToken },
      select: { userId: true },
    });

    if (!purchase?.userId) {
      throw new BadRequestException('Purchase token is not linked to a user');
    }

    const verification = await this.verifyGooglePurchase(dto, Platform.ANDROID);
    const state = await this.upsertSubscriptionAndPurchase(purchase.userId, verification);

    await this.prisma.createAuditLog({
      action: 'SUBSCRIPTION_SYNC',
      entityType: 'Subscription',
      entityId: purchase.userId,
      userId: adminUserId,
      changes: {
        purchaseToken: dto.purchaseToken,
        productId: dto.productId,
      },
    });

    return {
      isPremium: state.isPremium,
      status: state.status,
      expiresAt: state.expiresAt,
    };
  }

  /** POST /subscription/webhook/google */
  async handleGoogleWebhook(payload: any): Promise<{ received: boolean }> {
    const parsed = this.parseGoogleWebhookPayload(payload);

    if (parsed.kind === 'test') {
      this.logger.log('Google Play test notification received');
      return { received: true };
    }

    if (parsed.kind === 'one_time') {
      // This backend handles subscription flow only; one-time purchases are acknowledged and ignored.
      this.logger.log('Google Play one-time product notification received');
      return { received: true };
    }

    if (parsed.kind === 'unknown') {
      // Ack unknown RTDN payloads to avoid Pub/Sub retry storms; request payload is persisted in API logs.
      this.logger.warn(`Google Play unknown notification received: ${parsed.eventType}`);
      return { received: true };
    }

    if (parsed.kind === 'voided') {
      this.logger.log('Google Play voided purchase notification received');
      await this.handleVoidedPurchaseWebhook(parsed);
      return { received: true };
    }

    this.logger.log(`Handle Google webhook: ${parsed.eventType}`);

    // Ensure purchase token exists in DB first (for restore/sync operations).
    const purchase = await this.prisma.purchase.upsert({
      where: { purchaseToken: parsed.purchaseToken },
      create: {
        userId: null,
        platform: parsed.platform,
        productId: parsed.productId,
        purchaseToken: parsed.purchaseToken,
        status: this.mapWebhookEventToPurchaseStatus(parsed.eventType),
        rawData: parsed.rawData,
      },
      update: {
        platform: parsed.platform,
        productId: parsed.productId,
        status: this.mapWebhookEventToPurchaseStatus(parsed.eventType),
        rawData: parsed.rawData,
      },
      select: { userId: true },
    });

    if (!purchase.userId) {
      return { received: true };
    }

    // Sync to latest authoritative state from Google Play.
    try {
      const verification = await this.verifyGooglePurchase(
        {
          productId: parsed.productId,
          purchaseToken: parsed.purchaseToken,
        },
        parsed.platform,
        true, // isWebhook = true
      );
      const state = await this.upsertSubscriptionAndPurchase(purchase.userId, verification);

      await this.prisma.createAuditLog({
        action: 'SUBSCRIPTION_WEBHOOK_GOOGLE',
        entityType: 'Subscription',
        entityId: purchase.userId,
        userId: purchase.userId,
        changes: {
          eventType: parsed.eventType,
          status: state.status,
          expiresAt: state.expiresAt,
          autoRenew: state.autoRenew,
        },
      });
    } catch (error) {
      // For webhooks, log errors but always return 200 OK to prevent Pub/Sub retry storms
      this.logger.error(
        `Error processing webhook for purchase ${parsed.purchaseToken}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.prisma.createAuditLog({
        action: 'SUBSCRIPTION_WEBHOOK_GOOGLE_ERROR',
        entityType: 'Subscription',
        entityId: purchase.userId,
        userId: purchase.userId,
        changes: {
          eventType: parsed.eventType,
          error: error instanceof Error ? error.message : String(error),
          purchaseToken: parsed.purchaseToken,
        },
      });
    }

    return { received: true };
  }

  private parseGoogleWebhookPayload(payload: any): ParsedGoogleWebhook {
    // Google Pub/Sub push format
    const base64Data = payload?.message?.data;

    if (typeof base64Data === 'string') {
      const decoded = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));

      const notification = decoded?.subscriptionNotification;
      const testNotification = decoded?.testNotification;
      const voidedPurchaseNotification = decoded?.voidedPurchaseNotification;
      const oneTimeProductNotification = decoded?.oneTimeProductNotification;

      if (testNotification) {
        return {
          kind: 'test',
          eventType: 'TEST_NOTIFICATION',
          platform: Platform.ANDROID,
          productId: '',
          purchaseToken: '',
          packageName: decoded?.packageName,
          rawData: decoded,
        };
      }

      if (voidedPurchaseNotification) {
        const purchaseToken = voidedPurchaseNotification?.purchaseToken;
        if (!purchaseToken) {
          throw new BadRequestException(
            'Invalid Google Pub/Sub voidedPurchaseNotification payload',
          );
        }

        return {
          kind: 'voided',
          eventType: 'VOIDED_PURCHASE',
          platform: Platform.ANDROID,
          productId: 'VOIDED_UNKNOWN',
          purchaseToken,
          packageName: decoded?.packageName,
          orderId: voidedPurchaseNotification?.orderId,
          rawData: decoded,
        };
      }

      if (oneTimeProductNotification) {
        return {
          kind: 'one_time',
          eventType: 'ONE_TIME_PRODUCT',
          platform: Platform.ANDROID,
          productId: oneTimeProductNotification?.sku || oneTimeProductNotification?.productId || '',
          purchaseToken: oneTimeProductNotification?.purchaseToken || '',
          packageName: decoded?.packageName,
          orderId: oneTimeProductNotification?.orderId,
          rawData: decoded,
        };
      }

      const purchaseToken = notification?.purchaseToken;
      const productId = notification?.subscriptionId;
      const notificationType = notification?.notificationType;

      if (!purchaseToken || !productId) {
        return {
          kind: 'unknown',
          eventType: 'UNKNOWN_SUBSCRIPTION_PAYLOAD',
          platform: Platform.ANDROID,
          productId: '',
          purchaseToken: '',
          packageName: decoded?.packageName,
          rawData: decoded,
        };
      }

      return {
        kind: 'subscription',
        eventType: this.mapGoogleNotificationTypeToEventName(notificationType),
        platform: Platform.ANDROID,
        productId,
        purchaseToken,
        packageName: decoded?.packageName,
        rawData: decoded,
      };
    }

    // Backward-compatible direct JSON payload
    if (payload?.eventType && payload?.productId && payload?.purchaseToken) {
      return {
        kind: 'subscription',
        eventType: String(payload.eventType),
        platform: payload.platform ?? Platform.ANDROID,
        productId: String(payload.productId),
        purchaseToken: String(payload.purchaseToken),
        packageName: payload.packageName,
        rawData: payload,
      };
    }

    return {
      kind: 'unknown',
      eventType: 'UNSUPPORTED_WEBHOOK_FORMAT',
      platform: Platform.ANDROID,
      productId: '',
      purchaseToken: '',
      rawData: payload ?? {},
    };
  }

  private mapGoogleNotificationTypeToEventName(notificationType: number): string {
    const mapping: Record<number, string> = {
      1: 'RECOVERED',
      2: 'RENEWED',
      3: 'CANCELED',
      4: 'PURCHASED',
      5: 'ON_HOLD',
      6: 'GRACE_PERIOD',
      7: 'RESTARTED',
      8: 'PRICE_CHANGE_CONFIRMED',
      9: 'DEFERRED',
      10: 'PAUSED',
      11: 'PAUSE_SCHEDULE_CHANGED',
      12: 'REVOKED',
      13: 'EXPIRED',
      19: 'PRICE_STEP_UP_CONSENT_UPDATED',
      20: 'PENDING_PURCHASE_CANCELED',
      22: 'PRICE_CHANGE_UPDATED',
    };
    return mapping[notificationType] ?? `UNKNOWN_${notificationType}`;
  }

  private mapWebhookEventToPurchaseStatus(eventType: string): PurchaseStatus {
    const normalized = eventType.toUpperCase();

    if (
      normalized.includes('PURCHASED') ||
      normalized.includes('RENEWED') ||
      normalized.includes('RECOVERED') ||
      normalized.includes('RESTARTED') ||
      normalized.includes('DEFERRED')
    ) {
      return PurchaseStatus.PURCHASED;
    }
    if (
      normalized.includes('CANCELED') ||
      normalized.includes('ON_HOLD') ||
      normalized.includes('PAUSED')
    ) {
      return PurchaseStatus.CANCELED;
    }
    if (normalized.includes('EXPIRED')) {
      return PurchaseStatus.EXPIRED;
    }
    if (normalized.includes('REVOKED')) {
      return PurchaseStatus.REVOKED;
    }
    if (normalized.includes('GRACE')) {
      return PurchaseStatus.PENDING;
    }

    return PurchaseStatus.PENDING;
  }

  private mapGoogleSubscriptionStateToPurchaseStatus(state: string | undefined): PurchaseStatus {
    switch (state) {
      case 'SUBSCRIPTION_STATE_ACTIVE':
        return PurchaseStatus.PURCHASED;
      case 'SUBSCRIPTION_STATE_PENDING':
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
        return PurchaseStatus.PENDING;
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_PAUSED':
      case 'SUBSCRIPTION_STATE_CANCELED':
      case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
        return PurchaseStatus.CANCELED;
      case 'SUBSCRIPTION_STATE_EXPIRED':
        return PurchaseStatus.EXPIRED;
      default:
        return PurchaseStatus.PENDING;
    }
  }

  private async handleVoidedPurchaseWebhook(parsed: ParsedGoogleWebhook): Promise<void> {
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: { purchaseToken: parsed.purchaseToken },
      select: {
        userId: true,
        productId: true,
      },
    });

    const productId = existingPurchase?.productId || parsed.productId;
    const userId = existingPurchase?.userId ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.purchase.upsert({
        where: { purchaseToken: parsed.purchaseToken },
        create: {
          userId,
          platform: parsed.platform,
          productId,
          purchaseToken: parsed.purchaseToken,
          orderId: parsed.orderId ?? null,
          status: PurchaseStatus.REVOKED,
          rawData: parsed.rawData,
        },
        update: {
          userId,
          platform: parsed.platform,
          productId,
          orderId: parsed.orderId ?? null,
          status: PurchaseStatus.REVOKED,
          rawData: parsed.rawData,
        },
      });

      if (!userId) {
        return;
      }

      await tx.subscription.updateMany({
        where: { userId },
        data: {
          status: SubscriptionStatus.CANCELED,
          autoRenew: false,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isPremium: false },
      });

      await tx.auditLog.create({
        data: {
          action: 'SUBSCRIPTION_VOIDED',
          entityType: 'Subscription',
          entityId: userId,
          userId,
          changes: {
            purchaseToken: parsed.purchaseToken,
            orderId: parsed.orderId ?? null,
            eventType: parsed.eventType,
          },
        },
      });
    });
  }
}
