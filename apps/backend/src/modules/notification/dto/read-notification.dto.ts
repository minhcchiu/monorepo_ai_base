import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReadNotificationDto {
  @ApiProperty({
    description: 'Notification id',
    format: 'uuid',
  })
  @IsUUID()
  idNotification: string;
}
