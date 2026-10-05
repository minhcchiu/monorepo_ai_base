import { axiosInstance } from '@/lib/axios';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  Notification,
  GetNotificationsParams,
  SendUserNotificationPayload,
  SendManyNotificationsPayload,
  BroadcastNotificationPayload,
  BroadcastResult,
  SendNotificationResult,
} from './types';

export const getNotifications = async (
  params: GetNotificationsParams
): Promise<ApiResponse<PaginatedData<Notification>>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Notification>>>(
    '/admin/notifications',
    { params }
  );
  return data;
};

export const sendUserNotification = async (
  payload: SendUserNotificationPayload
): Promise<ApiResponse<SendNotificationResult>> => {
  const { data } = await axiosInstance.post<ApiResponse<SendNotificationResult>>(
    '/admin/notifications/send-user',
    payload
  );
  return data;
};

export const sendManyNotifications = async (
  payload: SendManyNotificationsPayload
): Promise<ApiResponse<SendNotificationResult[]>> => {
  const { data } = await axiosInstance.post<ApiResponse<SendNotificationResult[]>>(
    '/admin/notifications/send-many',
    payload
  );
  return data;
};

export const broadcastNotification = async (
  payload: BroadcastNotificationPayload
): Promise<ApiResponse<BroadcastResult>> => {
  const { data } = await axiosInstance.post<ApiResponse<BroadcastResult>>(
    '/admin/notifications/broadcast',
    payload
  );
  return data;
};

/**
 * TODO(FIX-07): nhóm contract `admin` chưa có endpoint xoá thông báo — vẫn phải gọi
 * `DELETE /notification/{id}` (scope app/user), và endpoint đó lọc theo userId từ token
 * nên admin chỉ xoá được thông báo của chính mình. Cần lead mở thêm endpoint admin.
 */
export const deleteNotification = async (id: string): Promise<ApiResponse<unknown>> => {
  const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/notification/${id}`);
  return data;
};
