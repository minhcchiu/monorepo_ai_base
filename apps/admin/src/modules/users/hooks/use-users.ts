'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers, getUserById } from '../api';
import { userKeys } from './query-keys';
import type { GetUsersParams } from '../types';

export const useUsers = (params: GetUsersParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
  });

export const useUserById = (id: string) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
  });
