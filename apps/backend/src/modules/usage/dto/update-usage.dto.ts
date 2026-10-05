import { IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsageDto {
  @ApiProperty({ description: 'Action count', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  actionCount?: number;

  @ApiProperty({ description: 'Last scan date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  lastActionDate?: string;

  @ApiProperty({ description: 'Reward count', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rewardCount?: number;
}
