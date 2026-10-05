import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PaginationDto
 *
 * Standard pagination DTO for list endpoints.
 * Provides skip, take pattern for cursor-based pagination.
 *
 * @example
 * // Query: GET /users?page=1&limit=10
 * @Query() pagination: PaginationDto
 *
 * // Calculation:
 * const skip = (pagination.page - 1) * pagination.limit;
 * const result = await service.findMany({
 *   skip,
 *   take: pagination.limit,
 * });
 */
export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  /**
   * Get skip value for Prisma findMany
   */
  getSkip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Get take value for Prisma findMany
   */
  getTake(): number {
    return this.limit;
  }
}

/**
 * PaginationResponseDto
 *
 * Standard pagination response format.
 * Used for consistent API responses with paginated data.
 *
 * @example
 * {
 *   data: [...],
 *   meta: {
 *     page: 1,
 *     limit: 10,
 *     total: 50,
 *     totalPages: 5
 *   }
 * }
 */
export class PaginationResponseDto<T> {
  data: T[];
  /** Chuẩn: { page, limit, total } (kèm totalPages cho tiện). */
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

/**
 * BaseResponseDto
 *
 * Standard response format for all API endpoints.
 * Provides consistent error and success handling.
 *
 * @example
 * {
 *   success: true,
 *   message: "User created successfully",
 *   data: { id: "...", email: "..." },
 *   timestamp: "2024-01-20T10:30:00Z"
 * }
 */
export class BaseResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;

  constructor(success: boolean, message: string, data?: T, error?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data);
  }

  static error<T = any>(message: string, error?: string): BaseResponseDto<T> {
    return new BaseResponseDto<T>(false, message, undefined, error);
  }
}
