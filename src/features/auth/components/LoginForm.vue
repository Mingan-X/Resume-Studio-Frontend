<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { safeRedirect } from '@/shared/lib/routeInput';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { useLoginMutation } from '../api/session';
const username = ref(''),
  password = ref(''),
  validation = ref('');
const mutation = useLoginMutation(),
  route = useRoute(),
  router = useRouter();
async function submit() {
  if (mutation.isPending.value) return;
  validation.value = '';
  if (!username.value.trim() || password.value.length < 15 || password.value.length > 256) {
    validation.value = '请输入账号及15–256字符口令。';
    return;
  }
  try {
    await mutation.mutateAsync({
      username: username.value.trim().toLowerCase(),
      password: password.value,
    });
    password.value = '';
    await router.replace(safeRedirect(route.query.redirect));
  } catch {
    password.value = '';
  }
}
onScopeDispose(() => {
  password.value = '';
});
</script>
<template>
  <section class="login-panel">
    <h1>登录 Resume Studio</h1>
    <p>使用管理员创建的账号登录，继续查看自己的简历和报告。</p>
    <form @submit.prevent="submit">
      <fieldset :disabled="mutation.isPending.value">
        <legend>账号登录</legend>
        <label for="login-name">账号</label
        ><input
          id="login-name"
          v-model="username"
          autocomplete="username"
          minlength="3"
          maxlength="64"
          required
        /><label for="login-password">口令</label
        ><input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          minlength="15"
          maxlength="256"
          required
        />
        <p v-if="validation" role="alert">{{ validation }}</p>
        <button type="submit">{{ mutation.isPending.value ? '正在登录…' : '登录' }}</button>
      </fieldset>
    </form>
    <ErrorNotice v-if="mutation.error.value" :error="mutation.error.value" @retry="submit" />
  </section>
</template>
<style scoped>
.login-panel {
  max-width: 32rem;
  margin: var(--space-8) auto;
  padding: var(--space-8);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
fieldset {
  border: 0;
  padding: 0;
}
legend {
  position: absolute;
  clip-path: inset(50%);
}
label {
  display: block;
  margin: var(--space-4) 0 var(--space-2);
}
input {
  width: 100%;
  font: inherit;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
button {
  margin-top: var(--space-6);
}
</style>
