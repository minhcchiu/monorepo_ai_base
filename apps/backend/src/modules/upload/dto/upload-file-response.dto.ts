import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ example: 'https://cdn.domain.com/uploads/documents/file123.pdf' })
  url: string;

  @ApiProperty({ example: 'file123.pdf' })
  filename: string;

  @ApiProperty({ example: 345678 })
  size: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;
}
