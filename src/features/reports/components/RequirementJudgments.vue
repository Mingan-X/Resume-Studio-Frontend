<script setup lang="ts">
import type { ReportContent, ScoreResult } from '../model/contracts';
import { reportErrorLabel } from '../model/labels';
import EvidenceList from './EvidenceList.vue';
defineProps<{ result: ScoreResult; content: ReportContent }>();
const verdictLabels = { met: '满足', partial: '部分满足', unmet: '不满足', unknown: '证据不足' };
</script>
<template>
  <details>
    <summary>逐项判断、贡献与证据</summary>
    <article v-for="item in result.contributions" :key="item.requirementId">
      <h4>
        {{
          content.jobs
            .find((job) => job.id === result.jobVersionId)
            ?.requirements.find((requirement) => requirement.stableId === item.requirementId)
            ?.description ?? '要求说明未提供'
        }}
      </h4>
      <p
        v-if="item.execution.status === 'DONE'"
        :class="`verdict-${item.execution.judgment.verdict}`"
      >
        {{ verdictLabels[item.execution.judgment.verdict] }} · 贡献 {{ item.contribution }}
      </p>
      <p v-else class="incomplete">
        未完成（{{
          item.execution.status === 'BUDGET'
            ? '预算截断'
            : item.execution.status === 'FAILED'
              ? '处理失败'
              : '待执行'
        }}） · 贡献 {{ item.contribution }}
      </p>
      <template v-if="item.execution.status === 'DONE'"
        ><p>{{ item.execution.judgment.reason }}</p>
        <EvidenceList
          :references="item.execution.judgment.evidenceRefs"
          :document="content.extractedDocument"
      /></template>
      <p v-else>{{ reportErrorLabel(item.execution.errorCode) }}</p>
    </article>
  </details>
</template>
<style scoped>
article {
  padding-block: var(--space-4);
  border-top: 1px solid var(--border);
}
h4 {
  margin: 0;
}
.verdict-met {
  color: var(--success);
}
.verdict-partial,
.incomplete {
  color: var(--warning);
}
.verdict-unmet {
  color: var(--danger);
}
.verdict-unknown {
  color: var(--unknown);
}
summary {
  cursor: pointer;
}
</style>
