<script setup lang="ts">
import { computed } from 'vue';

import { AppError } from '@/shared/api/errors';

const props = withDefaults(defineProps<{ error?: unknown; path: string; message?: string }>(), {
  message: '',
});
const invalid = computed(
  () =>
    props.error instanceof AppError &&
    props.error.details?.fields.some(
      (field) => field.path === props.path || field.path.startsWith(props.path + '.'),
    ),
);
</script>
<template>
  <p v-if="message || invalid" class="field-error" role="alert">
    {{ message || '请检查此字段，服务端未接受当前值。' }}
  </p>
</template>
<style scoped>
.field-error {
  color: var(--danger);
  margin-block: var(--space-2);
}
</style>
