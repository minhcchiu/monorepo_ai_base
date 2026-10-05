import { IsBoolean, IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform, PlanType, PurchaseStatus, SubscriptionStatus } from '../../../common/constants';

export class VerifyPurchaseDto {
  @ApiProperty({ enum: Platform, example: Platform.IOS })
  @IsEnum(Platform)
  platform!: Platform;

  @ApiProperty({ example: 'weekly_plan' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'purchase-token-string' })
  @IsString()
  purchaseToken!: string;
}

export class VerifyPurchaseResponseDto {
  @ApiProperty({ example: true })
  isPremium!: boolean;

  @ApiProperty({ enum: PlanType, example: PlanType.WEEKLY })
  plan!: PlanType;

  @ApiProperty({ example: true })
  isTrial!: boolean;

  @ApiProperty({ example: '2026-05-20T00:00:00.000Z', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ example: true })
  autoRenew!: boolean;
}

export class RestorePurchaseDto {
  @ApiProperty({ example: 'purchase-token-string' })
  @IsString()
  purchaseToken!: string;

  @ApiProperty({ example: 'yearly_plan' })
  @IsString()
  productId!: string;
}

export class RestorePurchaseResponseDto {
  @ApiProperty({ example: true })
  isPremium!: boolean;

  @ApiProperty({ example: '2026-12-01T00:00:00.000Z', nullable: true })
  expiresAt!: Date | null;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({ example: true })
  isPremium!: boolean;

  @ApiProperty({ enum: PlanType, example: PlanType.YEARLY, nullable: true })
  plan!: PlanType | null;

  @ApiProperty({ example: false })
  isTrial!: boolean;

  @ApiProperty({ example: '2026-12-01T00:00:00.000Z', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ example: true })
  autoRenew!: boolean;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE, nullable: true })
  status!: SubscriptionStatus | null;
}

export class SyncPurchaseDto {
  @ApiProperty({ example: 'purchase-token-string' })
  @IsString()
  purchaseToken!: string;

  @ApiProperty({ example: 'weekly_plan' })
  @IsString()
  productId!: string;
}

export class SyncPurchaseResponseDto {
  @ApiProperty({ example: true })
  isPremium!: boolean;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @ApiProperty({ example: '2026-12-01T00:00:00.000Z', nullable: true })
  expiresAt!: Date | null;
}

export class GoogleWebhookDto {
  @ApiProperty({ example: 'RENEWED' })
  @IsString()
  eventType!: string;

  @ApiProperty({ enum: Platform, example: Platform.ANDROID })
  @IsEnum(Platform)
  platform!: Platform;

  @ApiProperty({ example: 'weekly_plan' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'purchase-token-string' })
  @IsString()
  purchaseToken!: string;

  @ApiProperty({ example: 'ORDER-123', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isTrial?: boolean;

  @ApiProperty({ example: '2026-12-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: '2026-05-08T01:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  purchaseTime?: string;

  @ApiProperty({ enum: PurchaseStatus, required: false, example: PurchaseStatus.PURCHASED })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}
