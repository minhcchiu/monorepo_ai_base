import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 *
 * Sets required roles for an endpoint.
 * Used in conjunction with RoleGuard to enforce role-based access control.
 *
 * Usage:
 * @Roles('ADMIN', 'MODERATOR')
 * @UseGuards(JwtGuard, RoleGuard)
 * deleteUser(@Param('id') id: string) { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * RequirePermission Decorator
 *
 * Sets required permission for an endpoint.
 * Used in conjunction with PermissionGuard.
 *
 * Usage:
 * @RequirePermission('user:create')
 * @UseGuards(JwtGuard, PermissionGuard)
 * createUser(...) { ... }
 */
export const RequirePermission = (permission: string) => SetMetadata('permission', permission);

/**
 * Public Decorator
 *
 * Marks an endpoint as public (no authentication required).
 * Useful when you want to enforce authentication globally but need exceptions.
 *
 * Usage:
 * @Public()
 * @Post('login')
 * login(...) { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
