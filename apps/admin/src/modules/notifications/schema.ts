import { z } from 'zod';
import { BROADCAST_ROLES } from './types';

const NOTIFICATION_TYPES = ['SYSTEM_ANNOUNCEMENT', 'GENERAL'] as const;

/** Giới hạn khớp `@Length` của DTO backend để chặn lỗi 400 ngay trên form. */
const titleField = z
  .string()
  .trim()
  .min(1, 'Tiêu đề là bắt buộc')
  .max(160, 'Tiêu đề tối đa 160 ký tự');

const messageField = z
  .string()
  .trim()
  .min(1, 'Nội dung là bắt buộc')
  .max(1000, 'Nội dung tối đa 1000 ký tự');

/**
 * Dùng chung cho gửi MỘT và gửi NHIỀU người nhận: chọn 1 người -> `send-user`,
 * chọn nhiều người -> `send-many` (backend giới hạn tối đa 500 id).
 */
export const sendNotificationSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, 'Chọn ít nhất một người nhận')
    .max(500, 'Tối đa 500 người nhận mỗi lần gửi'),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  title: titleField,
  message: messageField,
});

export const broadcastNotificationSchema = z.object({
  roles: z.array(z.enum(BROADCAST_ROLES)).optional(),
  excludeAdmin: z.boolean().optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  title: titleField,
  message: messageField,
});

export type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;
export type BroadcastNotificationFormValues = z.infer<typeof broadcastNotificationSchema>;
