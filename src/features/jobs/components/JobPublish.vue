<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { useConfirmJobMutation, usePublishJobMutation } from '../api/mutations';
import type { JobVersion } from '../model/contracts';
import { indexLabel } from '../model/labels';

const props = defineProps<{ job: JobVersion }>();
const emit = defineEmits<{ saved: [job: JobVersion] }>();
const confirm = useConfirmJobMutation(),
  publish = usePublishJobMutation(() => props.job);
const hard = ref(false),
  weights = ref(false),
  notice = ref('');
watch(
  () => props.job.id,
  () => {
    hard.value = false;
    weights.value = false;
    notice.value = '';
    publish.reset();
  },
);
const pending = computed(() => confirm.isPending.value || publish.isPending.value);
async function publishJob() {
  if (pending.value || !hard.value || !weights.value || props.job.status !== 'DRAFT') return;
  if (!window.confirm('发布后此版本不可修改；后续修改会生成新草稿。确定发布岗位并创建索引任务？'))
    return;
  try {
    const saved = await confirm.mutateAsync({
      job: props.job,
      body: { hardRequirementsConfirmed: true, weightsConfirmed: true },
    });
    emit('saved', saved);
    await publish.mutateAsync();
    notice.value = '岗位已发布，索引任务已创建。';
  } catch {
    /* 保留同一发布键和安全错误。 */
  }
}
</script>
<template>
  <section aria-labelledby="publish-title">
    <h2 id="publish-title">发布岗位</h2>
    <p>发布后此版本不可修改，修改会生成新草稿；索引可用后才参与召回。</p>
    <template v-if="job.status === 'DRAFT'"
      ><label
        ><input v-model="hard" type="checkbox" :disabled="pending" />已逐条核对硬门槛与来源</label
      ><label
        ><input
          v-model="weights"
          type="checkbox"
          :disabled="pending"
        />已核对要求权重与六维权重</label
      ><button
        type="button"
        :disabled="pending || !hard || !weights || !job.requirements.length"
        @click="publishJob"
      >
        确认并发布
      </button></template
    >
    <p>
      当前索引：{{ indexLabel(job.indexStatus)
      }}<span v-if="job.indexStatus !== 'READY'">，未参与召回</span>
    </p>
    <ErrorNotice
      v-if="confirm.error.value || publish.error.value"
      :error="confirm.error.value ?? publish.error.value"
      @retry="publishJob"
    />
    <p role="status">{{ notice }}</p>
    <RouterLink v-if="publish.data.value" :to="`/tasks/${publish.data.value.taskId}`"
      >查看索引任务</RouterLink
    >
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
label {
  display: block;
  margin-block: var(--space-4);
}
</style>
