import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInternalNotificationInput,
  NotificationService,
} from '../notification/notification.service';
import { NotificationType, UserRole } from '../../common/constants/enums';
import { AdminSendUserNotificationDto } from './dto/admin-send-user-notification.dto';
import { AdminSendManyNotificationsDto } from './dto/admin-send-many-notifications.dto';
import { AdminBroadcastNotificationDto } from './dto/admin-broadcast-notification.dto';
import {
  AdminNotificationListItemDto,
  QueryAdminNotificationsDto,
} from './dto/query-admin-notifications.dto';
import { PaginationResponseDto } from '../../common/dtos';

@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Danh sách thông báo đã gửi toàn hệ thống (phân trang).
   * KHÔNG ép `userId` theo token admin — `userId` chỉ là bộ lọc tuỳ chọn,
   * nên bảng admin thấy được thông báo gửi cho mọi người nhận.
   */
  async findAll(
    query: QueryAdminNotificationsDto,
  ): Promise<PaginationResponseDto<AdminNotificationListItemDto>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(query.userId && { userId: query.userId }),
      ...(query.type && { type: query.type }),
      ...(typeof query.isRead !== 'undefined' && { isRead: query.isRead }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          referenceId: true,
          referenceType: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return new PaginationResponseDto(data as AdminNotificationListItemDto[], page, limit, total);
  }

  async sendToOne(dto: AdminSendUserNotificationDto, adminId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, isDeleted: true },
    });

    if (!target || target.isDeleted) {
      throw new NotFoundException('Target user not found');
    }

    const payload = this.buildPayload(dto, [dto.userId]);
    const notifications = await this.persistNotifications(payload, adminId, {
      mode: 'SINGLE',
      targetUserIds: [dto.userId],
    });

    await this.notificationService.dispatchPushNotifications(notifications);

    return {
      targetedUsers: 1,
      createdNotifications: notifications.length,
    };
  }

  async sendToMany(dto: AdminSendManyNotificationsDto, adminId: string) {
    const uniqueUserIds = Array.from(new Set(dto.userIds));
    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        isDeleted: false,
      },
      select: { id: true },
    });

    const foundIds = new Set(recipients.map((item) => item.id));
    const missingIds = uniqueUserIds.filter((id) => !foundIds.has(id));

    if (missingIds.length) {
      throw new BadRequestException({
        message: 'Some target users are invalid or deleted',
        missingUserIds: missingIds,
      });
    }

    const payload = this.buildPayload(dto, uniqueUserIds);
    const notifications = await this.persistNotifications(payload, adminId, {
      mode: 'MULTI',
      targetUserIds: uniqueUserIds,
    });

    await this.notificationService.dispatchPushNotifications(notifications);

    return {
      targetedUsers: uniqueUserIds.length,
      createdNotifications: notifications.length,
    };
  }

  async broadcast(dto: AdminBroadcastNotificationDto, adminId: string) {
    const includeRoles = this.resolveRoles(dto.roles, dto.excludeAdmin !== false);

    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(includeRoles.length ? { role: { in: includeRoles as any } } : {}),
      } as any,
      select: { id: true },
    });

    if (!users.length) {
      return {
        targetedUsers: 0,
        createdNotifications: 0,
      };
    }

    const userIds = users.map((user) => user.id);
    const payload = this.buildPayload(dto, userIds);
    const notifications = await this.persistNotifications(payload, adminId, {
      mode: 'BROADCAST',
      targetUserIds: userIds,
      roles: includeRoles,
      excludeAdmin: dto.excludeAdmin !== false,
    });

    await this.notificationService.dispatchPushNotifications(notifications);

    return {
      targetedUsers: userIds.length,
      createdNotifications: notifications.length,
    };
  }

  private async persistNotifications(
    payload: CreateInternalNotificationInput[],
    adminId: string,
    metadata: Record<string, any>,
  ) {
    const result = await this.prisma.executeTransaction(async (tx) => {
      const created = await this.notificationService.createManyInternal(tx, payload);

      await tx.createAuditLog({
        action: 'ADMIN_SEND_NOTIFICATION',
        entityType: 'Notification',
        entityId: adminId,
        userId: adminId,
        changes: {
          ...metadata,
          payloadSummary: {
            type: payload[0]?.type,
            title: payload[0]?.title,
            referenceId: payload[0]?.referenceId ?? null,
            referenceType: payload[0]?.referenceType ?? null,
          },
          createdCount: created.count,
        },
      });

      return created.notifications;
    });

    return result;
  }

  private buildPayload(
    dto:
      AdminSendUserNotificationDto | AdminSendManyNotificationsDto | AdminBroadcastNotificationDto,
    userIds: string[],
  ): CreateInternalNotificationInput[] {
    const type = dto.type ?? NotificationType.SYSTEM_ANNOUNCEMENT;
    const title = dto.title.trim();
    const message = dto.message.trim();

    return userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
    }));
  }

  private resolveRoles(roles: UserRole[] | undefined, excludeAdmin: boolean) {
    const uniqueRoles = Array.from(new Set((roles ?? []).map((role) => role)));

    if (!uniqueRoles.length) {
      return excludeAdmin
        ? [UserRole.USER, UserRole.MODERATOR]
        : [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN];
    }

    return excludeAdmin ? uniqueRoles.filter((role) => role !== UserRole.ADMIN) : uniqueRoles;
  }
}
