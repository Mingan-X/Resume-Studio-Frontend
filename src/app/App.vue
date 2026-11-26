<script setup lang="ts">
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { globalError } from './errors';
import MainLayout from './layouts/MainLayout.vue';
</script>

<template>
  <div v-if="globalError" class="global-error">
    <ErrorNotice :error="globalError" />
    <button type="button" @click="globalError = null">关闭提示</button>
  </div>
  <MainLayout />
</template>

<style scoped>
.global-error {
  padding: var(--space-4) var(--space-8);
}
</style>
