import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dtos';
import { NotificationType } from '../../../common/constants/enums';

/**
 * QueryAdminNotificationsDto
 *
 * Query cho GET /api/v1/admin/notifications.
 * Khác endpoint app/user (`GET /notification`): KHÔNG ép `userId` theo token —
 * admin đọc được thông báo của mọi người, `userId` chỉ là bộ lọc tuỳ chọn.
 * `isRead` đến từ query string nên parse `'true'/'false'` bằng `@Transform`
 * (cùng pattern với `modules/notification/dto/query-notification.dto.ts`).
 */
export class QueryAdminNotificationsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Lọc theo người nhận' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Lọc theo loại thông báo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ type: Boolean, description: 'Lọc theo trạng thái đã đọc' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRead?: boolean;
}

/**
 * Người nhận rút gọn nhúng trong danh sách thông báo của admin.
 */
export class AdminNotificationUserRefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  phone: string | null;
}

/**
 * Một dòng trong danh sách thông báo đã gửi (GET /api/v1/admin/notifications).
 */
export class AdminNotificationListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  referenceId: string | null;

  @ApiProperty({ nullable: true })
  referenceType: string | null;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: AdminNotificationUserRefDto, description: 'Người nhận thông báo' })
  user: AdminNotificationUserRefDto;
}
