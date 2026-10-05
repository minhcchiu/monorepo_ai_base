import type { GetNotificationsParams } from '../types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: GetNotificationsParams) => ['notifications', 'list', params] as const,
};
