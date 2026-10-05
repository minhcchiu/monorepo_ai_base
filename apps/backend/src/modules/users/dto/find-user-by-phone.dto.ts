import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindUserByPhoneDto {
  @ApiProperty({ description: 'Phone number to search user id' })
  @IsString()
  phone: string;
}
