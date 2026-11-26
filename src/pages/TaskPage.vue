<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { TaskProgress } from '@/features/tasks';
import { routeIdSchema } from '@/shared/lib/routeInput';

import NotFoundPage from './NotFoundPage.vue';

const route = useRoute();
const id = computed(() => routeIdSchema.safeParse(route.params.taskId));
</script>
<template>
  <TaskProgress v-if="id.success" :key="id.data" :task-id="id.data" /><NotFoundPage v-else />
</template>
