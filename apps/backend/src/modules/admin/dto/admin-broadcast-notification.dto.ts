import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, UserRole } from '../../../common/constants/enums';

export class AdminBroadcastNotificationDto {
  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    description:
      'Target roles. If omitted, sends to all non-deleted users (except ADMIN if excludeAdmin=true).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  excludeAdmin?: boolean;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.SYSTEM_ANNOUNCEMENT })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: 'Notification title', maxLength: 160 })
  @IsString()
  @Length(1, 160)
  title!: string;

  @ApiProperty({ description: 'Notification message body', maxLength: 1000 })
  @IsString()
  @Length(1, 1000)
  message!: string;

  @ApiPropertyOptional({ description: 'Reference entity id (optional)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference entity type (optional)' })
  @IsOptional()
  @IsString()
  referenceType?: string;
}
