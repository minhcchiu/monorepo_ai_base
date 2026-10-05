'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../api';
import { notificationKeys } from './query-keys';
import type { GetNotificationsParams } from '../types';

export const useNotifications = (params: GetNotificationsParams) =>
  useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
  });
