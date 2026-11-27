<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';

import { JobDetail } from '@/features/jobs';
import { routeIdSchema } from '@/shared/lib/routeInput';

import NotFoundPage from './NotFoundPage.vue';
const route = useRoute();
const input = computed(() =>
  z
    .object({ jobId: routeIdSchema, versionId: routeIdSchema.optional() })
    .safeParse({ jobId: route.params.jobId, versionId: route.query.versionId }),
);
</script>
<template>
  <JobDetail
    v-if="input.success"
    :key="input.data.jobId"
    :job-id="input.data.jobId"
    :version-id="input.data.versionId ?? ''"
  /><NotFoundPage v-else />
</template>
