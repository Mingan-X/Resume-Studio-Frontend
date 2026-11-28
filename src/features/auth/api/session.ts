import type { QueryClient } from '@tanstack/vue-query';
import { useMutation, useQueryClient } from '@tanstack/vue-query';

import type { LoginData } from '@/generated/types.gen';
import {
  zGetAuthSessionResponse,
  zLoginBody,
  zLoginResponse,
  zLogoutResponse,
} from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { AppError } from '@/shared/api/errors';
import { csrfHeaders, setCsrf } from '@/shared/api/sessionContext';

import { useSessionStore } from '../model/session';

export const sessionKey = ['auth', 'session'] as const;
export async function loadSession(client: QueryClient, store: ReturnType<typeof useSessionStore>) {
  try {
    const result = await client.fetchQuery({
      queryKey: sessionKey,
      retry: false,
      staleTime: 30000,
      queryFn: async () => {
        const response = await apiRequest('/auth/session', zGetAuthSessionResponse);
        setCsrf(response.csrfToken);
        return { user: response.user, expiresAt: response.expiresAt };
      },
    });
    store.user = result.user;
    store.development = false;
    store.ready = true;
    return result.user;
  } catch (error) {
    if (import.meta.env.DEV && error instanceof AppError && error.status === 404) {
      store.development = true;
      store.ready = true;
      store.user = null;
      setCsrf(undefined);
      return null;
    }
    throw error;
  }
}
export function useLoginMutation() {
  const client = useQueryClient(),
    store = useSessionStore();
  return useMutation({
    retry: false,
    mutationFn: async (body: LoginData['body']) => {
      await client.invalidateQueries({ queryKey: sessionKey, exact: true });
      await loadSession(client, store);
      const response = await apiRequest('/auth/login', zLoginResponse, {
        method: 'POST',
        body: zLoginBody.parse(body),
        headers: csrfHeaders('POST'),
        retries: 0,
      });
      setCsrf(response.csrfToken);
      return { user: response.user, expiresAt: response.expiresAt };
    },
    onSuccess: async (session) => {
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, session);
      store.user = session.user;
      store.ready = true;
      store.development = false;
    },
  });
}
export function useLogoutMutation() {
  const client = useQueryClient(),
    store = useSessionStore();
  return useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest('/auth/logout', zLogoutResponse, {
        method: 'POST',
        body: {},
        headers: csrfHeaders('POST'),
        retries: 0,
      }),
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      setCsrf(undefined);
      store.clear();
    },
  });
}
