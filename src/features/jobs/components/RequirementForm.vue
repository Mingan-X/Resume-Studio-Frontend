<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useUnsavedChanges } from '@/shared/lib/useUnsavedChanges';
import FieldError from '@/shared/ui/FieldError.vue';

import type { JobVersion, Requirement } from '../model/contracts';
import { requirementSchema } from '../model/contracts';
import { dimensionLabels } from '../model/labels';

const props = withDefaults(
  defineProps<{ job: JobVersion; requirement?: Requirement; pending?: boolean; error?: unknown }>(),
  { pending: false },
);
const emit = defineEmits<{ save: [requirement: Requirement]; cancel: [] }>();
const initial = props.requirement;
const form = reactive({
  stableId: initial?.stableId ?? crypto.randomUUID(),
  dimension: initial?.dimension ?? 'engineering',
  kind: initial?.kind ?? 'SOFT',
  description: initial?.description ?? '',
  weight: initial?.weight ?? 1,
  priority: initial?.priority ?? 0,
});
const thresholdEnabled = ref(!!initial?.threshold),
  operator = ref<NonNullable<Requirement['threshold']>['operator']>(
    initial?.threshold?.operator ?? 'gte',
  );
const thresholdType = ref(
  initial?.threshold && typeof initial.threshold.value === 'string' ? 'text' : 'number',
);
const thresholdValue = ref(String(initial?.threshold?.value ?? '')),
  unit = ref(initial?.threshold?.unit ?? '');
const source = ref<Requirement['sourceRef'] | null>(initial?.sourceRef ?? null);
const baseline = JSON.stringify({
  form,
  source: source.value,
  thresholdEnabled: thresholdEnabled.value,
  thresholdValue: thresholdValue.value,
  unit: unit.value,
  operator: operator.value,
});
useUnsavedChanges(
  () =>
    JSON.stringify({
      form,
      source: source.value,
      thresholdEnabled: thresholdEnabled.value,
      thresholdValue: thresholdValue.value,
      unit: unit.value,
      operator: operator.value,
    }) !== baseline,
);
const sourceArea = ref<HTMLTextAreaElement>(),
  validation = ref<Record<string, string>>({});
function chooseSource(whole = false) {
  const block = props.job.document.blocks[0];
  if (!block) return;
  const start = whole ? 0 : (sourceArea.value?.selectionStart ?? 0),
    end = whole ? block.text.length : (sourceArea.value?.selectionEnd ?? 0);
  if (end <= start) {
    validation.value.sourceRef = '请在原文中选择一段文字。';
    return;
  }
  source.value = {
    sourceType: 'JD',
    sourceVersionId: props.job.id,
    blockId: block.id,
    start,
    end,
    quote: block.text.slice(start, end),
  };
  validation.value.sourceRef = '';
}
function save() {
  validation.value = {};
  const result = requirementSchema.safeParse({
    ...form,
    threshold: thresholdEnabled.value
      ? {
          operator: operator.value,
          value:
            thresholdType.value === 'number' ? Number(thresholdValue.value) : thresholdValue.value,
          unit: unit.value,
        }
      : null,
    sourceRef: source.value,
  });
  if (thresholdEnabled.value && !thresholdValue.value.trim()) {
    validation.value.threshold = '请输入阈值。';
    return;
  }
  if (!result.success) {
    for (const issue of result.error.issues)
      validation.value[String(issue.path[0])] = '请填写有效内容，数值须有限且非负。';
    return;
  }
  emit('save', result.data);
}
</script>
<template>
  <form @submit.prevent="save">
    <fieldset :disabled="pending">
      <legend>确认一条岗位要求</legend>
      <label for="requirement-description">要求描述</label
      ><textarea
        id="requirement-description"
        v-model="form.description"
        rows="2"
        maxlength="4000"
        required
      /><FieldError
        path="requirement.description"
        :error="error"
        :message="validation.description ?? ''"
      />
      <label for="requirement-dimension">维度</label
      ><select id="requirement-dimension" v-model="form.dimension">
        <option
          v-for="entry in job.dimensionWeights"
          :key="entry.dimension"
          :value="entry.dimension"
        >
          {{ dimensionLabels[entry.dimension] }}
        </option></select
      ><FieldError path="requirement.dimension" :error="error" />
      <label for="requirement-kind">条件类型</label
      ><select id="requirement-kind" v-model="form.kind">
        <option value="SOFT">软条件</option>
        <option value="HARD">硬门槛</option></select
      ><FieldError path="requirement.kind" :error="error" />
      <label for="requirement-weight">要求权重</label
      ><input
        id="requirement-weight"
        v-model.number="form.weight"
        type="number"
        min="0"
        step="any"
        required
      /><FieldError path="requirement.weight" :error="error" :message="validation.weight ?? ''" />
      <label for="requirement-priority">优先级编号</label
      ><input
        id="requirement-priority"
        v-model.number="form.priority"
        type="number"
        min="0"
        step="1"
        required
      /><FieldError
        path="requirement.priority"
        :error="error"
        :message="validation.priority ?? ''"
      />
      <label><input v-model="thresholdEnabled" type="checkbox" />设置明确阈值</label>
      <div v-if="thresholdEnabled">
        <label for="threshold-operator">比较方式</label
        ><select id="threshold-operator" v-model="operator">
          <option value="gte">至少</option>
          <option value="lte">至多</option>
          <option value="eq">等于</option>
        </select>
        <label for="threshold-type">值类型</label
        ><select id="threshold-type" v-model="thresholdType">
          <option value="number">数值</option>
          <option value="text">文字</option>
        </select>
        <label for="threshold-value">阈值</label
        ><input id="threshold-value" v-model="thresholdValue" required /><label for="threshold-unit"
          >单位</label
        ><input id="threshold-unit" v-model="unit" required /><FieldError
          path="requirement.threshold"
          :error="error"
          :message="validation.threshold ?? ''"
        />
      </div>
      <label for="requirement-source">选择来源原文</label
      ><textarea
        id="requirement-source"
        ref="sourceArea"
        :value="job.document.blocks[0]?.text"
        rows="5"
        readonly
      />
      <div class="actions">
        <button type="button" @click="chooseSource()">引用所选文字</button
        ><button type="button" @click="chooseSource(true)">引用整段正文</button>
      </div>
      <blockquote v-if="source">{{ source.quote }}</blockquote>
      <FieldError
        path="requirement.sourceRef"
        :error="error"
        :message="validation.sourceRef ?? ''"
      />
      <div class="actions">
        <button type="submit">保存这条要求</button
        ><button type="button" @click="emit('cancel')">关闭编辑</button>
      </div>
    </fieldset>
  </form>
</template>
<style scoped>
fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-6);
}
label {
  display: block;
  margin: var(--space-4) 0 var(--space-2);
}
textarea,
input:not([type='checkbox']),
select {
  font: inherit;
  max-width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}
textarea {
  width: 100%;
}
blockquote {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border-left: 3px solid var(--border);
  padding-left: var(--space-4);
  margin-inline: 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
</style>
