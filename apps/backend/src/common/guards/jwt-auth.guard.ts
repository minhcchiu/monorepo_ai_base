import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

/**
 * JwtAuthGuard
 *
 * Extends Passport AuthGuard('jwt') to provide consistent NestJS UnauthorizedException
 * and additional logging when authentication fails. This ensures global HTTP
 * exception filters handle auth errors correctly (returning 401 instead of 500).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger('JwtAuthGuard');

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // err: unexpected error, info: passport info, user: authenticated user
    if (err) {
      this.logger.error('Auth error', err);
      throw err;
    }

    if (!user) {
      const message = info?.message || 'Unauthorized';
      const req = context.switchToHttp().getRequest();
      this.logger.warn(`Unauthorized request to ${req.method} ${req.url} - ${message}`);
      throw new UnauthorizedException(message);
    }

    return user;
  }
}
