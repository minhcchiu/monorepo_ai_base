import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsageDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Action count', required: false, default: 0 })
  @IsOptional()
  actionCount?: number;

  @ApiProperty({ description: 'Reward count', required: false, default: 0 })
  @IsOptional()
  rewardCount?: number;
}
