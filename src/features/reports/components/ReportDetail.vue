<script setup lang="ts">
import RequestState from '@/shared/ui/RequestState.vue';

import { useReport } from '../api/useReport';
import ReportSummary from './ReportSummary.vue';
const props = defineProps<{ reportId: string }>();
const query = useReport(() => props.reportId);
</script>
<template>
  <RequestState :pending="query.isPending.value" :error="query.error.value" @retry="query.refetch()"
    ><div v-if="query.data.value" class="report"><ReportSummary :report="query.data.value" /></div
  ></RequestState>
</template>
<style scoped>
.report {
  max-width: 76rem;
}
</style>
