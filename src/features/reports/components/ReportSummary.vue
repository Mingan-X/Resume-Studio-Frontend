<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { localTime } from '@/shared/lib/localTime';

import type { Report } from '../model/contracts';
import { reportErrorLabel, reportWarningLabels } from '../model/labels';
defineProps<{ report: Report }>();
</script>
<template>
  <header>
    <h1>分析报告</h1>
    <p>
      报告版本 {{ report.revision }} ·
      <time :datetime="report.createdAt" :title="report.createdAt">{{
        localTime(report.createdAt)
      }}</time>
    </p>
    <p v-if="report.sourceReportId">
      来源报告：<RouterLink :to="`/reports/${report.sourceReportId}`">查看原报告</RouterLink>
    </p>
  </header>
  <section
    v-if="report.content.status === 'PARTIAL'"
    role="status"
    class="partial"
    aria-label="部分完成报告"
  >
    <h2>报告部分完成</h2>
    <p>
      已评估 {{ report.content.candidateCoverage.completed }} / 计划
      {{ report.content.candidateCoverage.planned }} 个岗位，未完成
      {{ report.content.candidateCoverage.incomplete }} 个。
    </p>
    <strong>排名仅基于已评估岗位</strong>
    <ul>
      <li v-for="warning in report.content.warnings" :key="warning">
        {{ reportWarningLabels[warning] }}
      </li>
    </ul>
    <p v-if="report.content.sectionErrors.profile">
      画像：{{ reportErrorLabel(report.content.sectionErrors.profile) }}
    </p>
    <p v-if="report.content.sectionErrors.matching">
      匹配：{{ reportErrorLabel(report.content.sectionErrors.matching) }}
    </p>
    <p>
      要求计划 {{ report.content.requirementCoverage.planned }}，已完成
      {{ report.content.requirementCoverage.completed }}，失败
      {{ report.content.requirementCoverage.failed }}，预算截断
      {{ report.content.requirementCoverage.truncated }}，待执行
      {{ report.content.requirementCoverage.pending }}。
    </p>
  </section>
  <dl>
    <div>
      <dt>简历版本</dt>
      <dd>{{ report.content.input.resumeVersionId }}</dd>
    </div>
    <div>
      <dt>岗位范围</dt>
      <dd>{{ report.content.input.jobCorpusVersionId }}</dd>
    </div>
    <div>
      <dt>分析基准日期</dt>
      <dd>{{ report.content.input.asOfDate }}</dd>
    </div>
    <div>
      <dt>Rubric / 评分规则</dt>
      <dd>{{ report.content.input.rubricVersion }} / {{ report.content.input.scoringVersion }}</dd>
    </div>
  </dl>
</template>
<style scoped>
.partial {
  padding: var(--space-6);
  background: var(--warning-soft);
  border-left: 4px solid var(--warning);
  border-radius: var(--radius);
}
h2 {
  margin-top: 0;
}
dl {
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
</style>
