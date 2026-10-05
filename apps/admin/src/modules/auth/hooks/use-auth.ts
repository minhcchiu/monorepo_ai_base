'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { login } from '../api';
import type { LoginPayload } from '../types';
import { setToken, setRefreshToken, storeUser } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import { ROUTES } from '@/constants/routes';

export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (res) => {
      setToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      storeUser(res.data.user);
      toast.success('Welcome back!', { description: res.message });
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Invalid credentials. Please try again.';
      toast.error('Login failed', { description: message });
    },
  });
};
