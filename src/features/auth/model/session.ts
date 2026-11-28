import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import type { GetAuthSessionResponse } from '@/generated/types.gen';

export type User = NonNullable<GetAuthSessionResponse['user']>;
export const useSessionStore = defineStore('session', () => {
  const user = shallowRef<User | null>(null),
    development = ref(false),
    ready = ref(false);
  function clear() {
    user.value = null;
    ready.value = false;
    development.value = false;
  }
  return { user, development, ready, clear };
});
