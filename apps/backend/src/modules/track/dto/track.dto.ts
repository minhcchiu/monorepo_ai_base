import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({ example: 'app_opened' })
  @IsString()
  event!: string;

  @ApiPropertyOptional({ example: { screen: 'home', source: 'camera' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
