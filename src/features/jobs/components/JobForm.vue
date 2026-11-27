<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { z } from 'zod';

import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import FieldError from '@/shared/ui/FieldError.vue';

import { useCreateJobMutation, useEditJobMutation } from '../api/mutations';
import type { JobVersion } from '../model/contracts';
import { createJobSchema } from '../model/contracts';

const props = defineProps<{ job?: JobVersion }>();
const emit = defineEmits<{ saved: [job: JobVersion] }>();
const form = reactive({
  title: props.job?.title ?? '',
  city: props.job?.city ?? '',
  level: props.job?.level ?? '',
  skills: props.job?.skills.join(', ') ?? '',
  body: props.job?.document.blocks[0]?.text ?? '',
});
const baseline = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== baseline.value);
const creating = useCreateJobMutation(),
  editing = useEditJobMutation();
const pending = computed(() => creating.isPending.value || editing.isPending.value);
const error = computed(() => creating.error.value ?? editing.error.value);
const validation = ref<Record<string, string>>({}),
  importError = ref(''),
  savedNotice = ref('');
function leave() {
  return !dirty.value || window.confirm('有未保存的修改，确定离开并放弃这些修改？');
}
onBeforeRouteLeave(leave);
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
};
window.addEventListener('beforeunload', beforeUnload);
onScopeDispose(() => window.removeEventListener('beforeunload', beforeUnload));
async function importText(event: Event) {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files?.[0]) return;
  const file = event.target.files[0];
  event.target.value = '';
  if (!/\.txt$/i.test(file.name) || file.size > 800000) {
    importError.value = '请选择不超过800000字节的.txt文件。';
    return;
  }
  try {
    form.body = z
      .string()
      .max(200000)
      .parse(await file.text());
    importError.value = '';
  } catch {
    importError.value = '无法导入，正文不能超过200000字符。';
  }
}
async function save() {
  if (pending.value) return;
  validation.value = {};
  savedNotice.value = '';
  const parsed = createJobSchema.safeParse({
    title: form.title.trim(),
    city: form.city.trim() || null,
    level: form.level.trim() || null,
    skills: form.skills
      .split(/[,，]/)
      .map((value) => value.trim())
      .filter(Boolean),
    body: form.body,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      validation.value[String(issue.path[0])] = '请检查此字段的长度或内容。';
    return;
  }
  if (!parsed.data.body.trim()) {
    validation.value.body = '请输入职位说明正文。';
    return;
  }
  try {
    let saved: JobVersion;
    if (props.job) {
      const { body, ...metadata } = parsed.data;
      saved = await editing.mutateAsync({ job: props.job, body: { kind: 'metadata', metadata } });
      if (body !== saved.document.blocks[0]?.text)
        saved = await editing.mutateAsync({ job: saved, body: { kind: 'body', body } });
    } else saved = await creating.mutateAsync(parsed.data);
    baseline.value = JSON.stringify(form);
    savedNotice.value = '草稿已保存';
    emit('saved', saved);
  } catch {
    /* mutation保留安全错误，输入保持原样。 */
  }
}
</script>
<template>
  <form @submit.prevent="save">
    <p v-if="job?.status === 'PUBLISHED'">
      这是已发布版本。保存修改会生成新草稿，已发布版本保持不变。
    </p>
    <fieldset :disabled="pending">
      <legend>{{ job ? '编辑岗位草稿' : '新建岗位草稿' }}</legend>
      <label for="job-title">岗位名称</label
      ><input id="job-title" v-model="form.title" maxlength="256" required /><FieldError
        path="title"
        :error="error"
        :message="validation.title ?? ''"
      />
      <label for="job-city">城市（可选）</label
      ><input id="job-city" v-model="form.city" maxlength="128" /><FieldError
        path="city"
        :error="error"
        :message="validation.city ?? ''"
      />
      <label for="job-level">级别（可选）</label
      ><input id="job-level" v-model="form.level" maxlength="128" /><FieldError
        path="level"
        :error="error"
        :message="validation.level ?? ''"
      />
      <label for="job-skills">技能（逗号分隔，可选）</label
      ><input id="job-skills" v-model="form.skills" /><FieldError
        path="skills"
        :error="error"
        :message="validation.skills ?? ''"
      />
      <label for="jd-file">导入职位说明.txt</label
      ><input id="jd-file" type="file" accept=".txt,text/plain" @change="importText" />
      <p v-if="importError" role="alert">{{ importError }}</p>
      <label for="jd-body">职位说明正文</label
      ><textarea
        id="jd-body"
        v-model="form.body"
        rows="10"
        maxlength="200000"
        required
      /><FieldError path="body" :error="error" :message="validation.body ?? ''" />
      <button type="submit">{{ pending ? '正在保存…' : '保存草稿' }}</button>
    </fieldset>
    <ErrorNotice v-if="error" :error="error" @retry="save" />
    <p role="status">{{ savedNotice }}</p>
  </form>
</template>
<style scoped>
form {
  max-width: 60rem;
}
fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-6);
  background: var(--surface);
}
label {
  display: block;
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}
input:not([type='file']),
textarea {
  width: 100%;
  font: inherit;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  background: var(--surface);
}
textarea {
  white-space: pre-wrap;
  resize: vertical;
}
button {
  margin-top: var(--space-4);
}
</style>
