import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators';
import { BaseResponseDto } from './common/dtos';

/**
 * AppController
 *
 * Root application controller.
 * Handles root-level endpoints like welcome message.
 *
 * All health-related endpoints are in HealthModule.
 */
@Controller()
export class AppController {
  private readonly logger = new Logger('AppController');

  constructor(private readonly appService: AppService) {}

  /**
   * Welcome endpoint
   *
   * Returns basic application information.
   * Useful for testing if API is responding.
   *
   * @example
   * GET /api/v1/
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "API is running",
   *   "data": {
   *     "message": "Welcome to NestJS Backend API"
   *   },
   *   "timestamp": "2024-01-20T10:30:00Z"
   * }
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  welcome(): BaseResponseDto<{ message: string }> {
    this.logger.log('Welcome endpoint accessed');
    const message = this.appService.getWelcomeMessage();
    return BaseResponseDto.success('API is running', { message });
  }
}
