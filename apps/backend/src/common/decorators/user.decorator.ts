import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * CurrentUser Decorator
 *
 * Extracts the current user from the request object.
 * Must be used with JwtGuard.
 *
 * Usage:
 * @UseGuards(JwtGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   // user contains the JWT payload
 * }
 *
 * To extract specific properties:
 * @CurrentUser('id') userId: string
 * @CurrentUser('role') role: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // If a specific property is requested, return only that
    return data ? user?.[data] : user;
  },
);

/**
 * CurrentUserId Decorator
 *
 * Convenience decorator to extract just the user ID.
 * Equivalent to @CurrentUser('id')
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUserId() userId: string) { ... }
 */
export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.['id'];
});
