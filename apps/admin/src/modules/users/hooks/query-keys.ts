import type { GetUsersParams } from '../types';

export const userKeys = {
  all: ['users'] as const,
  list: (params: GetUsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};
