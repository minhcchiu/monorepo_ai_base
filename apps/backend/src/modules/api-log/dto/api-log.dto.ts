import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryApiLogDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'POST' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: '/api/v1/subscription/webhook/google' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({ example: '33fe86b9-9e0f-45b5-90f6-2ecff88d1f8f' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2026-05-09T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-05-09T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ApiLogItemDto {
  @ApiProperty({ example: 'log-uuid' })
  id!: string;

  @ApiProperty({ example: 'request-id', nullable: true })
  requestId!: string | null;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiProperty({ example: '/api/v1/subscription/verify' })
  path!: string;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 45 })
  durationMs!: number;

  @ApiProperty({ example: 'user-uuid', nullable: true })
  userId!: string | null;

  @ApiProperty({ example: '::1', nullable: true })
  ipAddress!: string | null;

  @ApiProperty({ example: 'Mozilla/5.0', nullable: true })
  userAgent!: string | null;

  @ApiProperty({ type: Object, nullable: true })
  queryParams!: Record<string, any> | null;

  @ApiProperty({ type: Object, nullable: true })
  routeParams!: Record<string, any> | null;

  @ApiProperty({ type: Object, nullable: true })
  requestBody!: Record<string, any> | null;

  @ApiProperty({ type: Object, nullable: true })
  responseBody!: Record<string, any> | null;

  @ApiProperty({ example: 'HTTP_500', nullable: true })
  errorMessage!: string | null;

  @ApiProperty({ example: '2026-05-09T10:00:00.000Z' })
  createdAt!: Date;
}

export class ApiLogListResponseDto {
  @ApiProperty({ type: [ApiLogItemDto] })
  items!: ApiLogItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 450 })
  total!: number;

  @ApiProperty({ example: 23 })
  totalPages!: number;
}
