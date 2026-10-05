import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as Sentry from '@sentry/node';

/**
 * HttpExceptionFilter
 *
 * Global exception handler for HTTP exceptions.
 * Catches all HttpException and returns formatted error responses.
 *
 * Features:
 * - Consistent error response format
 * - Logging of errors
 * - Request tracking with requestId
 * - Sensitive data filtering
 *
 * Usage in main.ts:
 * app.useGlobalFilters(new HttpExceptionFilter());
 */
/**
 * Lấy `errorCode` nghiệp vụ do service ném ra, ví dụ:
 *   throw new ConflictException({ message: '...', errorCode: 'EMAIL_ALREADY_EXISTS' })
 * Không có thì suy ra mặc định: lỗi validate của ValidationPipe -> VALIDATION_ERROR,
 * còn lại -> tên HttpStatus (giữ nguyên hành vi cũ).
 */
function resolveErrorCode(exception: HttpException, status: number): string {
  const res = exception.getResponse();

  if (res instanceof Object && typeof (res as any).errorCode === 'string') {
    return (res as any).errorCode;
  }

  if (
    status === HttpStatus.BAD_REQUEST &&
    res instanceof Object &&
    Array.isArray((res as any).message)
  ) {
    return 'VALIDATION_ERROR';
  }

  return HttpStatus[status] ?? String(status);
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      message: exception.message,
      errors:
        exceptionResponse instanceof Object
          ? (exceptionResponse as any).message
          : exceptionResponse,
      statusCode: status,
      // errorCode (chuẩn mới) đặt cạnh statusCode (giữ cũ) — backward-compatible.
      errorCode: resolveErrorCode(exception, status),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] || 'unknown',
    };

    // Log error details
    if (status >= 500) {
      // Send to Sentry for server errors
      try {
        Sentry.captureException(exception);
      } catch (e) {
        this.logger.error('Sentry capture failed', e);
      }
      this.logger.error('Server Error:', errorResponse);
    } else if (status >= 400) {
      this.logger.warn('Client Error:', errorResponse);
    }

    response.status(status).json(errorResponse);
  }
}

/**
 * PrismaExceptionFilter
 *
 * Handles Prisma-specific errors and converts them to HTTP exceptions.
 *
 * Error Codes:
 * P2002: Unique constraint failed
 * P2025: Record not found
 * P2003: Foreign key constraint failed
 * P2014: Required relation violation
 *
 * Usage in main.ts:
 * app.useGlobalFilters(new PrismaExceptionFilter());
 */
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let details: any = null;

    // Handle specific Prisma error codes
    switch (exception.code) {
      // Unique constraint violation
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        details = {
          field: (exception.meta as any)?.target?.[0] || 'unknown',
        };
        break;

      // Record not found
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      // Foreign key constraint
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference ID provided';
        details = {
          field: (exception.meta as any)?.field_name || 'unknown',
        };
        break;

      // Required relation violation
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation is missing';
        break;

      // Default case
      default:
        this.logger.error('Unhandled Prisma Error:', exception);
        try {
          Sentry.captureException(exception);
        } catch (e) {
          this.logger.error('Sentry capture failed', e);
        }
        message = 'Database operation failed';
    }

    const errorResponse = {
      success: false,
      message,
      details,
      statusCode: status,
      errorCode: exception.code, // mã Prisma (P2002, P2025...) làm errorCode
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] || 'unknown',
    };

    this.logger.warn('Prisma Error:', errorResponse);
    // Capture server-side database errors in Sentry
    if (status >= 500) {
      try {
        Sentry.captureException(exception);
      } catch (e) {
        this.logger.error('Sentry capture failed', e);
      }
    }
    response.status(status).json(errorResponse);
  }
}

/**
 * AllExceptionsFilter
 *
 * Catch-all filter for any unhandled exceptions.
 * Should be the last filter applied (lowest priority).
 *
 * Usage in main.ts:
 * app.useGlobalFilters(new AllExceptionsFilter());
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // If it's an HttpException (validation, bad request, etc.), return its original response
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const errorResponse = {
        success: false,
        message: exception.message,
        // LƯU Ý: không bật chi tiết lỗi/stacks trên production — chỉ show chi tiết khi NODE_ENV !== 'production'.
        errors:
          exceptionResponse instanceof Object
            ? (exceptionResponse as any).message
            : exceptionResponse,
        statusCode: status,
        errorCode: resolveErrorCode(exception, status),
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'] || 'unknown',
        ...(process.env.NODE_ENV === 'development' && {
          error: exception instanceof Error ? exception.message : String(exception),
        }),
      };

      this.logger.warn('Http Exception:', errorResponse);
      response.status(status).json(errorResponse);
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Capture unexpected/unhandled exceptions in Sentry
    try {
      Sentry.captureException(exception);
    } catch (e) {
      this.logger.error('Sentry capture failed', e);
    }
    this.logger.error('Unexpected Error:', exception);

    const errorResponse = {
      success: false,
      message: 'An unexpected error occurred',
      statusCode: status,
      errorCode: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] || 'unknown',
      ...(process.env.NODE_ENV === 'development' && {
        error: exception instanceof Error ? exception.message : String(exception),
      }),
    };

    response.status(status).json(errorResponse);
  }
}
