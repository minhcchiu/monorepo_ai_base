import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DashboardGroupBy {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export class DashboardOverviewQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class DashboardTimeSeriesQueryDto {
  @ApiPropertyOptional({ enum: DashboardGroupBy, required: true })
  @IsEnum(DashboardGroupBy)
  groupBy: DashboardGroupBy;

  @ApiPropertyOptional({ required: true })
  @IsDateString()
  dateFrom: string;

  @ApiPropertyOptional({ required: true })
  @IsDateString()
  dateTo: string;
}
