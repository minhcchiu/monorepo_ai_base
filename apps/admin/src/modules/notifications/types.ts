export type NotificationType = 'SYSTEM_ANNOUNCEMENT' | 'GENERAL';

export type NotificationReferenceType = string;

/**
 * Vai trò nhận broadcast — theo đúng enum `roles` của `AdminBroadcastNotificationDto`
 * (USER | MODERATOR | ADMIN).
 */
export const BROADCAST_ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
export type TargetUserRole = (typeof BROADCAST_ROLES)[number];

/** Người nhận rút gọn do `GET /admin/notifications` join kèm (`AdminNotificationUserRefDto`). */
export interface NotificationUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: NotificationUser;
}

/**
 * Query của `GET /admin/notifications` (`QueryAdminNotificationsDto`):
 * page/limit/userId/type/isRead. Backend bật `forbidNonWhitelisted` nên gửi thêm
 * param lạ (dateFrom…) sẽ bị 400.
 */
export interface GetNotificationsParams {
  page: number;
  limit: number;
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
}

// Giữ viết tay: DTO generate đánh dấu `type` required (do có default), nhưng form gửi `type`
// tuỳ chọn (dựa default backend). Rewire sẽ buộc sửa form — chưa cần thiết.
export interface SendUserNotificationPayload {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
}

export interface SendManyNotificationsPayload {
  userIds: string[];
  type?: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
}

export interface BroadcastNotificationPayload {
  roles?: TargetUserRole[];
  excludeAdmin?: boolean;
  type?: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
}

export interface BroadcastResult {
  sentCount: number;
  targetRole?: string;
  title: string;
}

export interface SendNotificationResult {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  createdAt: string;
}
