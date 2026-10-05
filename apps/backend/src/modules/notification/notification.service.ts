import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '../../common/constants/enums';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FirebaseMessagingService } from './firebase-messaging.service';

export type CreateInternalNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseMessagingService: FirebaseMessagingService,
  ) {}

  private readonly notificationSelect = {
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
    deletedAt: true,
  };

  async create(dto: CreateNotificationDto) {
    const created = await this.prisma.notification.create({
      data: dto as any,
      select: this.notificationSelect,
    });

    await this.dispatchPushNotifications([
      {
        userId: created.userId,
        type: created.type,
        title: created.title,
        message: created.message,
        referenceId: created.referenceId ?? undefined,
        referenceType: created.referenceType ?? undefined,
      },
    ]);

    return created;
  }

  async createManyInternal(prisma: any, notifications: CreateInternalNotificationInput[]) {
    const deduplicated = this.normalizeNotifications(notifications);

    if (!deduplicated.length) {
      return { count: 0, notifications: [] };
    }

    // Bản ghi DB chỉ nhận đúng các cột của bảng `Notification`.
    const created = await prisma.notification.createMany({
      data: deduplicated.map((notification) => ({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        referenceId: notification.referenceId,
        referenceType: notification.referenceType,
      })) as any,
    });

    return {
      count: created.count,
      notifications: deduplicated,
    };
  }

  async registerDeviceToken(userId: string, token: string) {
    const normalizedToken = this.normalizeToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isDeleted: true,
        fcmTokens: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const nextTokens = Array.from(new Set([...(user.fcmTokens ?? []), normalizedToken]));
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fcmTokens: {
          set: nextTokens,
        },
      },
      select: {
        fcmTokens: true,
      },
    });

    return {
      token: normalizedToken,
      totalTokens: updated.fcmTokens.length,
    };
  }

  async removeDeviceToken(userId: string, token: string) {
    const normalizedToken = this.normalizeToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isDeleted: true,
        fcmTokens: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const nextTokens = (user.fcmTokens ?? []).filter((item) => item !== normalizedToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fcmTokens: {
          set: nextTokens,
        },
      },
    });

    return {
      removed: nextTokens.length !== (user.fcmTokens ?? []).length,
      totalTokens: nextTokens.length,
    };
  }

  async dispatchPushNotifications(notifications: CreateInternalNotificationInput[]) {
    const deduplicated = this.normalizeNotifications(notifications);

    if (!deduplicated.length || !this.firebaseMessagingService.isEnabled()) {
      return { successCount: 0, failureCount: 0 };
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: Array.from(new Set(deduplicated.map((item) => item.userId))) },
        isDeleted: false,
      },
      select: {
        id: true,
        fcmTokens: true,
      },
    });

    const tokensByUserId = new Map<string, string[]>(
      recipients.map((recipient) => [recipient.id, this.normalizeTokens(recipient.fcmTokens)]),
    );

    const groupedPayloads = new Map<
      string,
      {
        tokens: Set<string>;
        title: string;
        body: string;
        data: Record<string, string>;
      }
    >();

    for (const notification of deduplicated) {
      const tokens = tokensByUserId.get(notification.userId) ?? [];
      if (!tokens.length) {
        continue;
      }

      const data = this.buildPushData(notification);
      // Group by content only (exclude userId) so broadcast to N users
      // produces O(1) batches instead of O(N) sequential Firebase calls.
      // FCM tokens already identify the recipient — userId in data is redundant.
      const key = JSON.stringify({
        title: notification.title,
        body: notification.message,
        type: notification.type,
        referenceId: notification.referenceId ?? null,
        referenceType: notification.referenceType ?? null,
      });

      const currentGroup = groupedPayloads.get(key) ?? {
        tokens: new Set<string>(),
        title: notification.title,
        body: notification.message,
        data,
      };

      for (const token of tokens) {
        currentGroup.tokens.add(token);
      }

      groupedPayloads.set(key, currentGroup);
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = new Set<string>();

    for (const payload of groupedPayloads.values()) {
      const result = await this.firebaseMessagingService.sendToTokens(Array.from(payload.tokens), {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      successCount += result.successCount;
      failureCount += result.failureCount;

      for (const token of result.invalidTokens) {
        invalidTokens.add(token);
      }
    }

    if (invalidTokens.size) {
      await this.removeInvalidDeviceTokens(Array.from(invalidTokens));
    }

    if (failureCount > 0) {
      this.logger.warn(`FCM sent with ${failureCount} failed deliveries.`);
    }

    return { successCount, failureCount };
  }

  async findAll(query: QueryNotificationDto, userId: string) {
    return this.findMyNotifications(query, userId);
  }

  async findMyNotifications(query: QueryNotificationDto, userId: string) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const where: any = { userId, deletedAt: null };
    if (query.type) where.type = query.type;
    if (typeof query.isRead !== 'undefined') {
      where.isRead = query.isRead;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.notificationSelect,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async countUnreadNotifications(userId: string) {
    const unread = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });

    return { unread };
  }

  async readNotification(idNotification: string, userId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id: idNotification,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.isRead) {
      return this.prisma.notification.findUnique({
        where: { id: idNotification },
        select: this.notificationSelect,
      });
    }

    return this.prisma.notification.update({
      where: { id: idNotification },
      data: {
        isRead: true,
        readAt: existing.readAt ?? new Date(),
      },
      select: this.notificationSelect,
    });
  }

  async readAllNotifications(userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: updated.count };
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: this.notificationSelect,
    });
    if (!item) throw new NotFoundException('Notification not found');
    return item;
  }

  async update(id: string, dto: UpdateNotificationDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: dto as any,
      select: this.notificationSelect,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: this.notificationSelect,
    });
  }

  async restore(id: string, userId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: { not: null },
      },
      select: {
        id: true,
      },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: null },
      select: this.notificationSelect,
    });
  }

  private normalizeNotifications(notifications: CreateInternalNotificationInput[]) {
    return notifications
      .filter((notification) => !!notification.userId)
      .filter(
        (notification, index, items) =>
          items.findIndex(
            (candidate) =>
              candidate.userId === notification.userId &&
              candidate.type === notification.type &&
              candidate.title.trim() === notification.title.trim() &&
              candidate.message.trim() === notification.message.trim() &&
              candidate.referenceId === notification.referenceId &&
              candidate.referenceType === notification.referenceType,
          ) === index,
      )
      .map((notification) => ({
        userId: notification.userId,
        type: notification.type,
        title: notification.title.trim(),
        message: notification.message.trim(),
        referenceId: notification.referenceId ?? null,
        referenceType: notification.referenceType ?? null,
      }));
  }

  private normalizeToken(token: string) {
    return token.trim();
  }

  private normalizeTokens(tokens: string[] | null | undefined) {
    return Array.from(new Set((tokens ?? []).map((token) => token.trim()).filter(Boolean)));
  }

  private buildPushData(notification: CreateInternalNotificationInput) {
    const data: Record<string, string> = {
      notificationType: notification.type,
    };

    if (notification.referenceId) {
      data.referenceId = notification.referenceId;
    }

    if (notification.referenceType) {
      data.referenceType = notification.referenceType;
    }

    return data;
  }

  private async removeInvalidDeviceTokens(tokens: string[]) {
    const uniqueTokens = this.normalizeTokens(tokens);
    if (!uniqueTokens.length) {
      return;
    }

    const tokenSet = new Set(uniqueTokens);
    const users = await this.prisma.user.findMany({
      where: {
        fcmTokens: {
          hasSome: uniqueTokens,
        },
      },
      select: {
        id: true,
        fcmTokens: true,
      },
    });

    await Promise.all(
      users.map((user) =>
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            fcmTokens: {
              set: user.fcmTokens.filter((token) => !tokenSet.has(token)),
            },
          },
        }),
      ),
    );
  }
}
