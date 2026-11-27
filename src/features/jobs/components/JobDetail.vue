<script setup lang="ts">
import { useRouter } from 'vue-router';

import RequestState from '@/shared/ui/RequestState.vue';

import { useJob } from '../api/useJobs';
import type { JobVersion } from '../model/contracts';
import { indexLabel, publicationLabel } from '../model/labels';
import JobForm from './JobForm.vue';

const props = withDefaults(defineProps<{ jobId: string; versionId?: string }>(), { versionId: '' });
const query = useJob(
    () => props.jobId,
    () => props.versionId,
  ),
  router = useRouter();
async function saved(job: JobVersion) {
  await router.replace({ path: `/jobs/${job.jobId}`, query: { versionId: job.id } });
}
</script>
<template>
  <h1>岗位详情</h1>
  <RequestState
    :pending="query.isPending.value"
    :error="query.error.value"
    @retry="query.refetch()"
  >
    <template v-if="query.data.value"
      ><p>
        版本 {{ query.data.value.version }} · {{ publicationLabel(query.data.value.status) }} ·
        {{ indexLabel(query.data.value.indexStatus) }}
      </p>
      <JobForm
        v-if="query.data.value.status === 'DRAFT' || query.data.value.status === 'PUBLISHED'"
        :job="query.data.value"
        @saved="saved"
      />
      <p v-else>当前版本状态待确认，暂不能编辑。</p>
    </template>
  </RequestState>
</template>
