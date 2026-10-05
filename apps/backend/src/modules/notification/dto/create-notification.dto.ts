import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { NotificationType } from '../../../common/constants/enums';

export class CreateNotificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  readAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  deletedAt?: string;
}
