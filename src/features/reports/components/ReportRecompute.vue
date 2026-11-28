<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { z } from 'zod';

import { useUnsavedChanges } from '@/shared/lib/useUnsavedChanges';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import FieldError from '@/shared/ui/FieldError.vue';

import { useRecompute } from '../api/useRecompute';
import type { Report } from '../model/contracts';
import { dimensionLabels } from '../model/labels';
const props = defineProps<{ report: Report }>(),
  router = useRouter();
const weights = ref(
  props.report.content.ranking?.results.map((result) => ({
    jobVersionId: result.jobVersionId,
    weights: {
      dimensionWeights: result.weightsSnapshot.dimensionWeights.map((entry) => ({ ...entry })),
      requirementWeights: result.weightsSnapshot.requirementWeights.map((entry) => ({ ...entry })),
    },
  })) ?? [],
);
const baseline = JSON.stringify(weights.value),
  saved = ref(false);
useUnsavedChanges(() => !saved.value && JSON.stringify(weights.value) !== baseline);
const mutation = useRecompute(
    () => props.report.id,
    () => ({ weights: weights.value }),
  ),
  validation = ref('');
const available = computed(() => !!props.report.content.scoreSetId && weights.value.length > 0);
async function submit() {
  if (mutation.isPending.value) return;
  validation.value = '';
  if (
    !weights.value.every((item) =>
      [...item.weights.dimensionWeights, ...item.weights.requirementWeights].every(
        (entry) => z.number().finite().nonnegative().safeParse(entry.weight).success,
      ),
    )
  ) {
    validation.value = '所有权重须为有限非负数。';
    return;
  }
  try {
    const report = await mutation.mutateAsync();
    saved.value = true;
    await router.push(`/reports/${report.id}`);
  } catch {
    /* 失败保留输入和同一操作键。 */
  }
}
</script>
<template>
  <section aria-labelledby="recompute-title">
    <h2 id="recompute-title">调权重算</h2>
    <p>只重用当前报告保存的判断和候选范围，生成新版本；原报告保持不变。</p>
    <p v-if="!available">本报告没有可重算的评分结果。</p>
    <form v-else @submit.prevent="submit">
      <fieldset :disabled="mutation.isPending.value">
        <legend>修改后端权重快照</legend>
        <details v-for="(item, jobIndex) in weights" :key="item.jobVersionId">
          <summary>
            {{
              report.content.jobs.find((job) => job.id === item.jobVersionId)?.title ??
              item.jobVersionId
            }}
          </summary>
          <div v-for="(entry, index) in item.weights.dimensionWeights" :key="entry.dimension">
            <label :for="`recompute-${item.jobVersionId}-${entry.dimension}`">{{
              dimensionLabels[entry.dimension]
            }}</label><input
              :id="`recompute-${item.jobVersionId}-${entry.dimension}`"
              v-model.number="entry.weight"
              type="number"
              min="0"
              step="any"
              required
            /><FieldError
              :path="`weights.${jobIndex}.weights.dimensionWeights.${index}.weight`"
              :error="mutation.error.value"
            />
          </div>
          <div v-for="(entry, index) in item.weights.requirementWeights" :key="entry.requirementId">
            <label :for="`requirement-${item.jobVersionId}-${entry.requirementId}`">{{
              report.content.jobs
                .find((job) => job.id === item.jobVersionId)
                ?.requirements.find((requirement) => requirement.stableId === entry.requirementId)
                ?.description ?? entry.requirementId
            }}</label><input
              :id="`requirement-${item.jobVersionId}-${entry.requirementId}`"
              v-model.number="entry.weight"
              type="number"
              min="0"
              step="any"
              required
            /><FieldError
              :path="`weights.${jobIndex}.weights.requirementWeights.${index}.weight`"
              :error="mutation.error.value"
            />
          </div>
        </details>
        <FieldError path="weights" :error="mutation.error.value" :message="validation" /><button
          type="submit"
        >
          {{ mutation.isPending.value ? '正在重算…' : '生成新报告版本' }}
        </button>
      </fieldset>
    </form>
    <ErrorNotice v-if="mutation.error.value" :error="mutation.error.value" @retry="submit" />
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
fieldset {
  border: 1px solid var(--border);
  padding: var(--space-6);
  border-radius: var(--radius);
  background: var(--surface);
}
details {
  margin-block: var(--space-4);
}
details > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-block: var(--space-2);
}
label {
  min-width: 8rem;
}
input {
  max-width: 9rem;
  font: inherit;
  padding: var(--space-2);
}
summary {
  cursor: pointer;
}
</style>
