<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { ReportDetail } from '@/features/reports';
import { routeIdSchema } from '@/shared/lib/routeInput';

import NotFoundPage from './NotFoundPage.vue';
const route = useRoute();
const id = computed(() => routeIdSchema.safeParse(route.params.reportId));
</script>
<template>
  <ReportDetail v-if="id.success" :key="id.data" :report-id="id.data" /><NotFoundPage v-else />
</template>
