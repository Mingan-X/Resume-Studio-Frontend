<script setup lang="ts">
import { ref, watch } from 'vue';

import { useUnsavedChanges } from '@/shared/lib/useUnsavedChanges';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import FieldError from '@/shared/ui/FieldError.vue';

import { useEditJobMutation, useSuggestJobMutation } from '../api/mutations';
import type { JobVersion, Requirement } from '../model/contracts';
import { editJobSchema } from '../model/contracts';
import { dimensionLabels } from '../model/labels';
import RequirementForm from './RequirementForm.vue';

const props = defineProps<{ job: JobVersion }>();
const emit = defineEmits<{ saved: [job: JobVersion] }>();
const edit = useEditJobMutation(),
  suggest = useSuggestJobMutation();
const selected = ref<Requirement>(),
  showForm = ref(false),
  formKey = ref(0),
  notice = ref('');
const weights = ref(props.job.dimensionWeights.map((entry) => ({ ...entry }))),
  weightError = ref('');
const weightsBaseline = ref(JSON.stringify(weights.value));
useUnsavedChanges(() => JSON.stringify(weights.value) !== weightsBaseline.value);
watch(
  () => props.job.document.textHash,
  () => {
    suggest.reset();
    showForm.value = false;
  },
);
function open(requirement?: Requirement) {
  selected.value = requirement;
  showForm.value = true;
  formKey.value++;
  edit.reset();
}
async function saveRequirement(requirement: Requirement) {
  try {
    const job = await edit.mutateAsync({
      job: props.job,
      body: { kind: 'requirement-upsert', requirement },
    });
    showForm.value = false;
    notice.value = '要求已保存，请核对后确认发布。';
    emit('saved', job);
  } catch {
    /* 保留字段与服务端错误。 */
  }
}
async function remove(stableId: string) {
  if (!window.confirm('确定移除这条岗位要求？发布前仍需重新确认。')) return;
  try {
    emit(
      'saved',
      await edit.mutateAsync({ job: props.job, body: { kind: 'requirement-delete', stableId } }),
    );
  } catch {
    /* 显示mutation错误。 */
  }
}
async function saveWeights() {
  weightError.value = '';
  const parsed = editJobSchema.safeParse({ kind: 'weights', dimensionWeights: weights.value });
  if (!parsed.success) {
    weightError.value = '每个权重须为有限非负数。';
    return;
  }
  try {
    emit('saved', await edit.mutateAsync({ job: props.job, body: parsed.data }));
    notice.value = '维度权重已保存，最终有效性由后端检查。';
    weightsBaseline.value = JSON.stringify(weights.value);
  } catch {
    /* 不归一化或替换服务端校验。 */
  }
}
</script>
<template>
  <section aria-labelledby="requirements-title">
    <h2 id="requirements-title">结构化要求</h2>
    <p>逐条核对条件和来源。抽取建议不会自动保存；未配置模型时可手工录入。</p>
    <div class="actions">
      <button
        type="button"
        :disabled="job.status !== 'DRAFT' || suggest.isPending.value || edit.isPending.value"
        @click="suggest.mutate(job)"
      >
        获取抽取建议</button
      ><button
        type="button"
        :disabled="job.status !== 'DRAFT' || edit.isPending.value"
        @click="open()"
      >
        手工录入要求
      </button>
    </div>
    <ErrorNotice
      v-if="suggest.error.value"
      :error="suggest.error.value"
      @retry="suggest.mutate(job)"
    />
    <ul v-if="suggest.data.value">
      <li v-for="item in suggest.data.value.suggestions.requirements" :key="item.stableId">
        <p>{{ item.description }}</p>
        <blockquote>{{ item.sourceRef.quote }}</blockquote>
        <button type="button" @click="open(item)">编辑并确认此建议</button>
      </li>
    </ul>
    <RequirementForm
      v-if="showForm"
      :key="formKey"
      :job="job"
      v-bind="selected ? { requirement: selected } : {}"
      :pending="edit.isPending.value"
      :error="edit.error.value"
      @save="saveRequirement"
      @cancel="showForm = false"
    />
    <ErrorNotice v-if="edit.error.value" :error="edit.error.value" />
    <p v-if="!job.requirements.length">还没有确认的要求，请获取建议或手工录入。</p>
    <div v-else class="table-scroll">
      <table>
        <caption>
          已保存的岗位要求
        </caption>
        <thead>
          <tr>
            <th>要求 / 来源</th>
            <th>维度</th>
            <th>类型</th>
            <th>阈值</th>
            <th>权重</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in job.requirements" :key="item.stableId">
            <td>
              {{ item.description }}
              <details>
                <summary>查看来源原文</summary>
                <blockquote>{{ item.sourceRef.quote }}</blockquote>
              </details>
            </td>
            <td>{{ dimensionLabels[item.dimension] }}</td>
            <td>{{ item.kind === 'HARD' ? '硬门槛' : '软条件' }}</td>
            <td>
              {{
                item.threshold
                  ? `${item.threshold.operator} ${item.threshold.value} ${item.threshold.unit}`
                  : '未设置'
              }}
            </td>
            <td>{{ item.weight }}</td>
            <td>
              <button
                type="button"
                :disabled="job.status !== 'DRAFT' || edit.isPending.value"
                @click="open(item)"
              >
                编辑要求</button
              ><button
                type="button"
                :disabled="job.status !== 'DRAFT' || edit.isPending.value"
                @click="remove(item.stableId)"
              >
                移除要求
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <form @submit.prevent="saveWeights">
      <fieldset :disabled="job.status !== 'DRAFT' || edit.isPending.value">
        <legend>维度权重</legend>
        <div v-for="(entry, index) in weights" :key="entry.dimension">
          <label :for="`weight-${entry.dimension}`">{{
            dimensionLabels[entry.dimension]
          }}</label><input
            :id="`weight-${entry.dimension}`"
            v-model.number="entry.weight"
            type="number"
            min="0"
            step="any"
            required
          /><FieldError :path="`dimensionWeights.${index}.weight`" :error="edit.error.value" />
        </div>
        <FieldError
          path="dimensionWeights"
          :error="edit.error.value"
          :message="weightError"
        /><button type="submit">保存维度权重</button>
      </fieldset>
    </form>
    <p role="status">{{ notice }}</p>
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
.actions {
  display: flex;
  gap: var(--space-4);
  margin-block: var(--space-4);
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}
th,
td {
  padding: var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.table-scroll {
  overflow-x: auto;
}
blockquote {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-inline: 0;
}
fieldset {
  border: 1px solid var(--border);
  padding: var(--space-6);
  border-radius: var(--radius);
  margin-top: var(--space-6);
}
fieldset > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-2);
}
label {
  min-width: 8rem;
}
input {
  font: inherit;
  padding: var(--space-2);
  max-width: 10rem;
}
</style>
