import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging device token',
    example: 'eXampleFcmTokenFromMobileApp',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token: string;
}
