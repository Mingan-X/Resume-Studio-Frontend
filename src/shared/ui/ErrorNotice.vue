<script setup lang="ts">
import { computed, ref } from 'vue';

import { normalizeError } from '@/shared/api/errors';

const props = defineProps<{ error: unknown }>();
const emit = defineEmits<{ retry: [] }>();
const error = computed(() => normalizeError(props.error));
const copyStatus = ref('');
async function copyRequestId() {
  if (!error.value.requestId) return;
  try {
    await navigator.clipboard.writeText(error.value.requestId);
    copyStatus.value = '已复制';
  } catch {
    copyStatus.value = '复制失败，请手动选择请求编号。';
  }
}
</script>

<template>
  <div role="alert" class="error-notice">
    <p>{{ error.status === 404 ? '不存在或无权访问' : error.message }}</p>
    <p v-if="error.requestId">
      请求编号：<code>{{ error.requestId }}</code>
      <button type="button" @click="copyRequestId">复制请求编号</button>
    </p>
    <span role="status">{{ copyStatus }}</span>
    <button v-if="error.retryable" type="button" @click="emit('retry')">重试</button>
  </div>
</template>

<style scoped>
.error-notice {
  border-left: 3px solid var(--danger);
  padding: var(--space-2) var(--space-4);
  background: var(--surface);
}
code {
  overflow-wrap: anywhere;
}
</style>
