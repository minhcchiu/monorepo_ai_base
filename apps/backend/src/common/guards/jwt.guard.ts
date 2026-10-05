import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * JwtGuard
 *
 * Validates JWT tokens in the Authorization header.
 * Extracts and verifies the token, attaching user data to the request.
 *
 * Usage:
 * @UseGuards(JwtGuard)
 * getUserProfile() {
 *   // The 'user' object is available in the request
 * }
 *
 * Token Format:
 * Authorization: Bearer <jwt_token>
 */
@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger('JwtGuard');

  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      // Attach user to request object for use in controller/service
      request.user = payload;
      return true;
    } catch (error) {
      this.logger.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * Format: Authorization: Bearer <token>
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}

/**
 * Optional JWT Guard
 *
 * Same as JwtGuard but makes token optional.
 * Useful for endpoints that work with or without authentication.
 *
 * Usage:
 * @UseGuards(OptionalJwtGuard)
 * getPublicContent() {
 *   // Works with or without token
 *   // request.user will be undefined if no token provided
 * }
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // Token is optional, so we allow the request to proceed
      request.user = null;
      return true;
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
    } catch {
      // Token is invalid, but we allow the request to proceed as unauthenticated
      request.user = null;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
