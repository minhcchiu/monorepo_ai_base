import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppInitRequestDto {
  @ApiProperty({ example: 'device-uuid-123' })
  @IsString()
  deviceId!: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class RemoteConfigDto {
  @ApiProperty({ example: 2 })
  maxFreeAction!: number;

  @ApiProperty({ example: 3 })
  maxFreeChat!: number;

  @ApiProperty({ example: true })
  adsEnabled!: boolean;
}

export class AppInitResponseDto {
  @ApiProperty({ example: true })
  isFirstInstall!: boolean;

  @ApiProperty({ example: false })
  isPremium!: boolean;

  @ApiProperty({ example: 2 })
  actionRemaining!: number;

  @ApiProperty({ example: 3 })
  chatRemaining!: number;

  @ApiProperty({ example: false })
  showPaywall!: boolean;

  @ApiProperty({ type: RemoteConfigDto })
  remoteConfig!: RemoteConfigDto;
}
