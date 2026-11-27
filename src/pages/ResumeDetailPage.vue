<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';

import { ResumeDetail } from '@/features/resumes';
import { routeIdSchema } from '@/shared/lib/routeInput';

import NotFoundPage from './NotFoundPage.vue';

const route = useRoute();
const optionalBlockIdSchema = routeIdSchema.catch('');
const ids = computed(() =>
  z
    .object({ resumeId: routeIdSchema, versionId: routeIdSchema })
    .safeParse({ resumeId: route.params.resumeId, versionId: route.query.versionId }),
);
const blockId = computed(() =>
  optionalBlockIdSchema.parse(route.hash.startsWith('#block-') ? route.hash.slice(7) : ''),
);
</script>
<template>
  <ResumeDetail
    v-if="ids.success"
    :resume-id="ids.data.resumeId"
    :version-id="ids.data.versionId"
    :block-id="blockId"
  /><NotFoundPage v-else />
</template>
