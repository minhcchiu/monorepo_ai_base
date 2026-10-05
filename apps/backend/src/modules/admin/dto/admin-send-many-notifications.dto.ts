import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { NotificationType } from '../../../common/constants/enums';

export class AdminSendManyNotificationsDto {
  @ApiProperty({
    description: 'Target user ids',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  userIds!: string[];

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
