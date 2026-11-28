<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';

import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { useLogoutMutation } from '../api/session';
import { useSessionStore } from '../model/session';
const session = useSessionStore(),
  logout = useLogoutMutation(),
  router = useRouter();
async function leave() {
  try {
    await logout.mutateAsync();
    await router.replace('/login');
  } catch {
    /* 显示错误。 */
  }
}
</script>
<template>
  <div class="session">
    <template v-if="session.user"
      ><span>{{ session.user.username }}</span
      ><button type="button" :disabled="logout.isPending.value" @click="leave">
        退出登录
      </button></template
    ><RouterLink v-else to="/login">登录</RouterLink
    ><ErrorNotice v-if="logout.error.value" :error="logout.error.value" />
  </div>
</template>
<style scoped>
.session {
  margin-left: auto;
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}
</style>
