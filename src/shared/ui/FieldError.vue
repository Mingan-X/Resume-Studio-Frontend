<script setup lang="ts">
import { computed, onMounted, onScopeDispose, onUpdated, ref, useId } from 'vue';

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
const root = ref<HTMLElement>();
const id = useId();
let field: Element | null = null;
function associate() {
  const previous = root.value?.previousElementSibling;
  if (
    previous instanceof HTMLInputElement ||
    previous instanceof HTMLTextAreaElement ||
    previous instanceof HTMLSelectElement
  ) {
    field = previous;
    previous.setAttribute('aria-invalid', 'true');
    previous.setAttribute('aria-describedby', id);
  } else if (!root.value && field) {
    field.removeAttribute('aria-invalid');
    if (field.getAttribute('aria-describedby') === id) field.removeAttribute('aria-describedby');
    field = null;
  }
}
onMounted(associate);
onUpdated(associate);
onScopeDispose(() => {
  if (field) {
    field.removeAttribute('aria-invalid');
    if (field.getAttribute('aria-describedby') === id) field.removeAttribute('aria-describedby');
  }
});
</script>
<template>
  <p v-if="message || invalid" :id="id" ref="root" class="field-error" role="alert">
    {{ message || '请检查此字段，服务端未接受当前值。' }}
  </p>
</template>
<style scoped>
.field-error {
  color: var(--danger);
  margin-block: var(--space-2);
}
</style>
