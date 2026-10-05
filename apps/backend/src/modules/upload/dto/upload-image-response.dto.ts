import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({ example: 'https://cdn.domain.com/uploads/avatar/abc123.jpg' })
  url: string;

  @ApiProperty({ example: 'abc123.jpg' })
  filename: string;

  @ApiProperty({ example: 234567 })
  size: number;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;
}
