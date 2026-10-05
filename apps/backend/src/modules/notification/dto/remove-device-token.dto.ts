import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RemoveDeviceTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging device token to remove',
    example: 'eXampleFcmTokenFromMobileApp',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token: string;
}
