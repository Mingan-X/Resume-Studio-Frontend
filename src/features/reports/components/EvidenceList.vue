<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import ErrorNotice from '@/shared/ui/ErrorNotice.vue';

import { useResumeSource } from '../api/useResumeSource';
import type { EvidenceRef, ReportContent } from '../model/contracts';
import { evidenceLocation, sourceKey } from '../model/evidence';
const props = defineProps<{
  references: EvidenceRef[];
  document: ReportContent['extractedDocument'];
}>();
const source = useResumeSource(() => props.document.sourceVersionId),
  requested = ref(false);
function resolve() {
  requested.value = true;
  void source.refetch();
}
</script>
<template>
  <details>
    <summary>展开来源证据</summary>
    <p v-if="!references.length">未提供来源证据。</p>
    <figure v-for="reference in references" :key="sourceKey(reference)">
      <blockquote>{{ reference.quote }}</blockquote>
      <figcaption>
        <template
          v-for="block in document.blocks.filter((item) => item.id === reference.blockId)"
          :key="block.id"
          ><p>{{ evidenceLocation(block) }}，字符区间 {{ reference.start }}–{{ reference.end }}</p>
          <details>
            <summary>核对完整文本块</summary>
            <p class="text">{{ block.text }}</p>
          </details></template
        ><RouterLink
          v-if="source.data.value"
          :to="{
            path: `/resumes/${source.data.value}`,
            query: { versionId: reference.sourceVersionId },
            hash: `#block-${reference.blockId}`,
          }"
          >打开简历来源位置</RouterLink
        >
      </figcaption>
    </figure>
    <button
      v-if="references.length && !source.data.value"
      type="button"
      :disabled="source.isFetching.value"
      @click="resolve"
    >
      查找原简历详情
    </button>
    <p v-if="requested && !source.isFetching.value && source.data.value === null" role="status">
      原简历详情不可用，可继续核对报告内保存的文本。
    </p>
    <ErrorNotice v-if="source.error.value" :error="source.error.value" @retry="resolve" />
  </details>
</template>
<style scoped>
figure {
  margin: var(--space-4) 0;
  padding-left: var(--space-4);
  border-left: 3px solid var(--border);
}
blockquote,
.text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-inline: 0;
}
figcaption {
  color: var(--text-muted);
}
summary {
  cursor: pointer;
}
</style>
