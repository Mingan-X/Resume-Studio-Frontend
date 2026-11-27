<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { AppError } from '@/shared/api/errors';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { useUploadResumeMutation } from '../api/useUploadResumeMutation';
import { resumeFileSchema } from '../model/uploadRules';

const upload = useUploadResumeMutation();
const validation = ref('');
const error = computed(() => (upload.error.value instanceof AppError ? upload.error.value : null));
const unsupported = computed(() =>
  error.value?.reason === 'SCANNED_PDF'
    ? '不支持扫描PDF，请上传带文本层的PDF。'
    : error.value?.reason === 'ENCRYPTED_FILE'
      ? '不支持加密文件，请先解除加密。'
      : '',
);
function select(files: FileList | null) {
  if (upload.isPending.value) return;
  if (!files || files.length !== 1) {
    validation.value = '每次请选择一个文件。';
    return;
  }
  const result = resumeFileSchema.safeParse(files[0]);
  if (!result.success) {
    validation.value = result.error.issues[0]?.message ?? '文件无效。';
    return;
  }
  validation.value = '';
  upload.selectFile(result.data);
}
function onChange(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    select(event.target.files);
    event.target.value = '';
  }
}
function onDrop(event: DragEvent) {
  select(event.dataTransfer?.files ?? null);
}
</script>

<template>
  <section
    class="upload-panel"
    aria-labelledby="upload-title"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <h2 id="upload-title">上传简历</h2>
    <p id="upload-hint">
      拖入或选择PDF、DOCX，最大10 MiB。PDF需有文本层，不支持扫描或加密文件；服务端仍会校验文件内容。
    </p>
    <label for="resume-file">选择简历文件</label>
    <input
      id="resume-file"
      type="file"
      accept=".pdf,.docx"
      aria-describedby="upload-hint"
      :disabled="upload.isPending.value"
      @change="onChange"
    />
    <p v-if="upload.file.value">已选择：{{ upload.file.value.name }}</p>
    <p v-if="validation" role="alert">{{ validation }}</p>
    <div aria-live="polite" aria-atomic="true">
      <template v-if="upload.isPending.value">
        <progress
          :value="upload.total.value === null ? undefined : upload.loaded.value"
          :max="upload.total.value ?? 1"
          aria-label="文件上传进度"
        />
        <p>
          {{ upload.loaded.value
          }}<template v-if="upload.total.value !== null"> / {{ upload.total.value }}</template>
          字节已传输；正在上传或等待文本解析。
        </p>
      </template>
      <p v-if="unsupported">{{ unsupported }}</p>
      <ErrorNotice
        v-if="upload.error.value"
        :error="upload.error.value"
        @retry="!validation && upload.submit()"
      />
      <p v-if="upload.isSuccess.value">上传与文本解析成功。</p>
    </div>
    <div class="actions">
      <button
        type="button"
        :disabled="
          !upload.file.value || !!validation || upload.isPending.value || upload.isSuccess.value
        "
        @click="upload.submit"
      >
        上传简历
      </button>
      <button v-if="upload.isPending.value" type="button" @click="upload.cancel">取消上传</button>
      <RouterLink
        v-if="upload.data.value"
        :to="{
          path: `/resumes/${upload.data.value.resumeId}`,
          query: { versionId: upload.data.value.resumeVersionId },
        }"
        >查看解析文本</RouterLink
      >
    </div>
  </section>
</template>

<style scoped>
.upload-panel {
  padding: var(--space-6);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
h2 {
  margin-top: 0;
}
p {
  max-width: 60rem;
}
input {
  display: block;
  margin-block: var(--space-2);
  font: inherit;
  max-width: 100%;
}
.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}
progress {
  width: 100%;
  accent-color: var(--brand);
}
</style>
