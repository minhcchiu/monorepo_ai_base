import { Injectable } from '@nestjs/common';

/**
 * AppService
 *
 * Core application service.
 * Contains basic application logic.
 *
 * In larger applications, create feature-specific services.
 */
@Injectable()
export class AppService {
  /**
   * Get welcome message
   */
  getWelcomeMessage(): string {
    return 'Welcome to NestJS Backend API - Production Ready Architecture';
  }
}
