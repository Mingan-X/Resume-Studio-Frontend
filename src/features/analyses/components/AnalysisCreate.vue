<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { localTime } from '@/shared/lib/localTime';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import FieldError from '@/shared/ui/FieldError.vue';
import RequestState from '@/shared/ui/RequestState.vue';

import { useAnalysisOptions, useCreateAnalysisMutation } from '../api/queries';
import { analysisInputSchema } from '../model/contracts';

const resumes = useAnalysisOptions('resumes'),
  corpora = useAnalysisOptions('corpora');
const resumeItems = computed(() => resumes.data.value?.pages.flatMap((page) => page.resumes) ?? []),
  corpusItems = computed(() => corpora.data.value?.pages.flatMap((page) => page.corpora) ?? []);
const config = computed(() => resumes.data.value?.pages[0]?.configuration);
const form = reactive({
  resumeVersionId: '',
  jobCorpusVersionId: '',
  asOfDate: localTime(new Date().toISOString()).slice(0, 10),
});
const mutation = useCreateAnalysisMutation(() => ({ ...form })),
  router = useRouter();
const validation = ref('');
const selectedResume = computed(() =>
    resumeItems.value.find((item) => item.resumeVersionId === form.resumeVersionId),
  ),
  selectedCorpus = computed(() =>
    corpusItems.value.find((item) => item.version === form.jobCorpusVersionId),
  );
async function submit() {
  if (mutation.isPending.value) return;
  const parsed = analysisInputSchema.safeParse(form);
  if (!parsed.success || !selectedResume.value || !selectedCorpus.value) {
    validation.value = '请选择简历版本、岗位范围和有效日期。';
    return;
  }
  validation.value = '';
  try {
    const created = await mutation.mutateAsync();
    await router.push(`/tasks/${created.taskId}`);
  } catch {
    /* 保留选择及原幂等键。 */
  }
}
</script>
<template>
  <h1>发起分析</h1>
  <p>选择已解析的简历版本和已冻结的岗位范围，确认版本后提交。</p>
  <RequestState
    :pending="resumes.isPending.value || corpora.isPending.value"
    :error="resumes.error.value ?? corpora.error.value"
    @retry="
      resumes.refetch();
      corpora.refetch();
    "
  >
    <p v-if="!config" role="status">分析服务尚未配置，暂不能创建任务。</p>
    <form @submit.prevent="submit">
      <fieldset :disabled="mutation.isPending.value">
        <legend>分析输入</legend>
        <label for="analysis-resume">简历版本</label
        ><select id="analysis-resume" v-model="form.resumeVersionId" required>
          <option value="" disabled>请选择已解析版本</option>
          <option
            v-for="item in resumeItems"
            :key="item.resumeVersionId"
            :value="item.resumeVersionId"
          >
            {{ item.resumeId }} · 版本 {{ item.version }}
          </option></select
        ><FieldError path="resumeVersionId" :error="mutation.error.value" />
        <p v-if="!resumeItems.length">
          没有可用简历，请先<RouterLink to="/resumes">上传并解析简历</RouterLink>。
        </p>
        <button
          v-if="resumes.hasNextPage.value"
          type="button"
          :disabled="resumes.isFetching.value"
          @click="resumes.fetchNextPage()"
        >
          更多简历版本
        </button>
        <label for="analysis-corpus">岗位范围</label
        ><select id="analysis-corpus" v-model="form.jobCorpusVersionId" required>
          <option value="" disabled>请选择岗位语料版本</option>
          <option v-for="item in corpusItems" :key="item.version" :value="item.version">
            {{ item.version }} · {{ item.jobCount }} 个岗位
          </option></select
        ><FieldError path="jobCorpusVersionId" :error="mutation.error.value" />
        <p v-if="!corpusItems.length">没有可用的已冻结岗位范围。</p>
        <button
          v-if="corpora.hasNextPage.value"
          type="button"
          :disabled="corpora.isFetching.value"
          @click="corpora.fetchNextPage()"
        >
          更多岗位范围
        </button>
        <label for="analysis-date">分析基准日期</label
        ><input id="analysis-date" v-model="form.asOfDate" type="date" required /><FieldError
          path="asOfDate"
          :error="mutation.error.value"
        />
        <section
          v-if="selectedResume && selectedCorpus"
          class="summary"
          aria-label="提交前版本确认"
        >
          <h2>本次使用的版本</h2>
          <p>简历版本：{{ selectedResume.resumeVersionId }}（版本 {{ selectedResume.version }}）</p>
          <p>文件指纹：{{ selectedResume.fileHash }}</p>
          <p>岗位范围：{{ selectedCorpus.version }}，{{ selectedCorpus.jobCount }} 个岗位</p>
          <p v-if="config">
            Rubric：{{ config.rubricVersion }}；评分规则：{{ config.scoringVersion }}
          </p>
        </section>
        <p v-if="validation" role="alert">{{ validation }}</p>
        <button type="submit" :disabled="!config || !selectedResume || !selectedCorpus">
          {{ mutation.isPending.value ? '正在创建…' : '创建分析任务' }}
        </button>
      </fieldset>
    </form>
    <ErrorNotice v-if="mutation.error.value" :error="mutation.error.value" @retry="submit" />
  </RequestState>
</template>
<style scoped>
fieldset {
  max-width: 62rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-6);
  background: var(--surface);
}
label {
  display: block;
  margin: var(--space-4) 0 var(--space-2);
}
select,
input {
  font: inherit;
  padding: var(--space-2);
  max-width: 100%;
}
select {
  width: 100%;
}
.summary {
  margin-block: var(--space-6);
  padding: var(--space-4);
  background: var(--brand-soft);
  overflow-wrap: anywhere;
}
</style>
