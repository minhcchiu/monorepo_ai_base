import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger('UploadService');

  constructor(private appConfig: AppConfigService) {}

  /** Dựng URL công khai cho file đã lưu trong `/uploads`. */
  private buildUrl(segments: string[]): string {
    return [this.appConfig.getPublicBaseUrl(), 'uploads', ...segments].join('/');
  }

  async storeImage(
    file: any,
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    this.logger.log(`Store uploaded file: ${file?.originalname} size=${file?.size}`);

    const filename = file.filename || file?.originalname;

    return {
      url: this.buildUrl(['image', filename]),
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async storeFile(
    file: any,
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    this.logger.log(`Store uploaded file (generic): ${file?.originalname} size=${file?.size}`);

    const filename = file.filename || file?.originalname;

    return {
      url: this.buildUrl(['file', filename]),
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async storeInFolder(
    file: any,
    folder: string,
  ): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    this.logger.log(
      `Store uploaded file in folder=${folder}: ${file?.originalname} size=${file?.size}`,
    );

    const filename = file.filename || file?.originalname;

    return {
      url: this.buildUrl([folder, filename]),
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
