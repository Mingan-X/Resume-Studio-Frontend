<script setup lang="ts">
import { nextTick, watch } from 'vue';

import { localTime } from '@/shared/lib/localTime';
import RequestState from '@/shared/ui/RequestState.vue';

import { useResumeVersion } from '../api/useResumeVersion';
import { locationLabel, warningLabels } from '../model/labels';

const props = withDefaults(
  defineProps<{ resumeId: string; versionId: string; blockId?: string }>(),
  { blockId: '' },
);
const query = useResumeVersion(
  () => props.resumeId,
  () => props.versionId,
);
watch([query.data, () => props.blockId], async () => {
  if (!query.data.value?.extractedDocument.blocks.some((block) => block.id === props.blockId))
    return;
  await nextTick();
  const target = document.getElementById(`block-${props.blockId}`);
  target?.scrollIntoView();
  target?.focus({ preventScroll: true });
});
</script>

<template>
  <h1>简历解析文本</h1>
  <RequestState
    :pending="query.isPending.value"
    :error="query.error.value"
    @retry="query.refetch()"
  >
    <template v-if="query.data.value">
      <dl class="metadata">
        <div>
          <dt>简历编号</dt>
          <dd>{{ query.data.value.resumeId }}</dd>
        </div>
        <div>
          <dt>版本</dt>
          <dd>{{ query.data.value.version }}</dd>
        </div>
        <div>
          <dt>上传时间</dt>
          <dd>
            <time :datetime="query.data.value.createdAt" :title="query.data.value.createdAt">{{
              localTime(query.data.value.createdAt)
            }}</time>
          </dd>
        </div>
        <div>
          <dt>文件类型 / 字节</dt>
          <dd>{{ query.data.value.file.mime }} / {{ query.data.value.file.size }}</dd>
        </div>
      </dl>
      <section
        v-if="query.data.value.extractedDocument.warnings.length"
        aria-label="解析警告"
        class="warnings"
      >
        <h2>解析警告</h2>
        <ul>
          <li v-for="warning in query.data.value.extractedDocument.warnings" :key="warning">
            {{ warningLabels[warning] }}
          </li>
        </ul>
      </section>
      <h2>来源文本块</h2>
      <p>以下为保存的解析文本。页码或段落位置由文件解析提供，内容按纯文本显示。</p>
      <article
        v-for="block in query.data.value.extractedDocument.blocks"
        :id="`block-${block.id}`"
        :key="block.id"
        tabindex="-1"
        class="block"
        :class="{ 'is-source-target': block.id === blockId }"
      >
        <h3>
          <a :href="`#block-${block.id}`">{{ locationLabel(block.location) }}</a>
        </h3>
        <p class="text">{{ block.text }}</p>
      </article>
    </template>
  </RequestState>
</template>

<style scoped>
.metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}
dt {
  color: var(--text-muted);
}
dd {
  margin: var(--space-2) 0 0;
  overflow-wrap: anywhere;
}
.block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-6);
  margin-block: var(--space-4);
  scroll-margin-top: var(--space-8);
}
.block:target,
.block.is-source-target {
  outline: 2px solid var(--brand);
}
h3 {
  margin-top: 0;
}
.text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.warnings {
  border-left: 3px solid var(--brand);
  padding-left: var(--space-4);
}
</style>
