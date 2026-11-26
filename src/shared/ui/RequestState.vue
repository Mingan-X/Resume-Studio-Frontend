<script setup lang="ts">
import ErrorNotice from './ErrorNotice.vue';

withDefaults(
  defineProps<{ pending?: boolean; error?: unknown; empty?: boolean; emptyText?: string }>(),
  { pending: false, empty: false, emptyText: '暂无内容，请稍后重试。' },
);
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div v-if="pending" class="skeleton" role="status" aria-busy="true">正在加载…</div>
  <ErrorNotice v-else-if="error" :error="error" @retry="emit('retry')" />
  <p v-else-if="empty" role="status">{{ emptyText }}</p>
  <slot v-else />
</template>

<style scoped>
.skeleton {
  min-height: 5rem;
  background: var(--brand-soft);
  border-radius: var(--radius);
  padding: var(--space-6);
  color: var(--text-muted);
}
</style>
