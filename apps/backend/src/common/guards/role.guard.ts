import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * RoleGuard
 *
 * Verifies that the authenticated user has the required role(s).
 * Must be used in conjunction with JwtGuard.
 *
 * Usage:
 * @UseGuards(JwtGuard, RoleGuard)
 * @Roles('ADMIN', 'MODERATOR')
 * deleteUser(@Param('id') id: string) {
 *   // Only ADMIN or MODERATOR can access
 * }
 *
 * The @Roles decorator must be applied first.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger('RoleGuard');

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the @Roles decorator.
    // Đọc ở CẢ method lẫn class: nhiều controller admin gắn @Roles ở mức class
    // (vd admin-users.controller.ts), reflector.get(handler) sẽ bỏ sót và cho qua hết.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verify user is authenticated
    if (!user) {
      this.logger.warn('User not authenticated');
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has one of the required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} with role ${user.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

/**
 * Permission Guard (Advanced Example)
 *
 * More granular permission checking beyond simple role-based access.
 * Useful for feature-based permissions or dynamic access control.
 *
 * Usage:
 * @UseGuards(JwtGuard, PermissionGuard)
 * @RequirePermission('user:edit')
 * updateUser() { ... }
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger('PermissionGuard');

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // This is a template - implement based on your permission system
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Implement your permission checking logic here
    // Example: check against user.permissions array or role-based mapping
    const userPermissions = this.getUserPermissions(user.role);

    const hasPermission = userPermissions.includes(requiredPermission);

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.id} denied access to resource requiring permission: ${requiredPermission}`,
      );
      throw new ForbiddenException(`Access denied. Required permission: ${requiredPermission}`);
    }

    return true;
  }

  /**
   * Map roles to permissions
   * Implement based on your application's permission model
   */
  private getUserPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      ADMIN: ['user:create', 'user:read', 'user:update', 'user:delete', 'user:manage'],
      MODERATOR: ['user:read', 'user:update', 'report:manage'],
      USER: ['user:read', 'profile:update'],
    };

    return permissionMap[role] || [];
  }
}
