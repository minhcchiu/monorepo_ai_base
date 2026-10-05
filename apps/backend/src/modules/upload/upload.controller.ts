import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import { UploadFileResponseDto } from './dto/upload-file-response.dto';
import { BaseResponseDto } from '../../common/dtos';
import { Public, ApiScope } from '../../common/decorators';
import * as fs from 'fs';

@Controller('upload')
@ApiScope('app', 'user')
@ApiTags('upload')
export class UploadController {
  private readonly logger = new Logger('UploadController');

  constructor(private uploadService: UploadService) {}

  @Public()
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'public', 'uploads', 'image');
          try {
            fs.mkdirSync(uploadPath, { recursive: true });
          } catch (err) {
            // ignore - mkdirSync may throw if exists when concurrent
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          // reject silently; controller will handle missing file
          return cb(null, false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async uploadImage(@UploadedFile() file: any): Promise<BaseResponseDto<UploadImageResponseDto>> {
    this.logger.log(`Upload image - file: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No image file provided or file type is not supported');
    }

    const result = await this.uploadService.storeImage(file);
    return BaseResponseDto.success('Image uploaded successfully', result);
  }

  @Public()
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'public', 'uploads', 'file');
          try {
            fs.mkdirSync(uploadPath, { recursive: true });
          } catch (err) {
            // ignore - mkdirSync may throw if exists when concurrent
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async uploadFile(@UploadedFile() file: any): Promise<BaseResponseDto<UploadFileResponseDto>> {
    this.logger.log(`Upload file - file: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.storeFile(file);
    return BaseResponseDto.success('File uploaded successfully', result);
  }

  @Public()
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'public', 'uploads', 'multiple');
          try {
            fs.mkdirSync(uploadPath, { recursive: true });
          } catch (err) {
            // ignore - mkdirSync may throw if exists when concurrent
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          return cb(null, false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async uploadMultiple(
    @UploadedFiles() files: any[],
  ): Promise<BaseResponseDto<UploadFileResponseDto[]>> {
    this.logger.log(`Upload multiple files - count: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map((f) => this.uploadService.storeInFolder(f, 'multiple')),
    );
    return BaseResponseDto.success('Files uploaded successfully', results);
  }
}
