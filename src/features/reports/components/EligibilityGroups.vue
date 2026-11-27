<script setup lang="ts">
import type { ReportContent, ScoreResult } from '../model/contracts';
import RequirementJudgments from './RequirementJudgments.vue';
defineProps<{ content: ReportContent }>();
const reasonLabels: Record<ScoreResult['eligibilityReasons'][number], string> = {
  NO_EFFECTIVE_REQUIREMENTS: '没有有效要求',
  HARD_UNMET: '有硬条件明确不满足',
  HARD_UNVERIFIED: '有硬条件尚无法验证',
  INCOMPLETE_JUDGMENTS: '部分要求尚未完成判断',
};
</script>
<template>
  <template v-if="content.ranking"
    ><section aria-labelledby="pending-title">
      <h2 id="pending-title">待核实岗位</h2>
      <p>这些岗位不进入推荐，不能将证据不足当成零分结论。</p>
      <p v-if="!content.ranking.pending.length">没有待核实岗位。</p>
      <article v-for="id in content.ranking.pending" :key="id">
        <h3>{{ content.jobs.find((job) => job.id === id)?.title ?? '岗位信息未提供' }}</h3>
        <template
          v-for="result in content.ranking.results.filter((item) => item.jobVersionId === id)"
          :key="result.jobVersionId"
          ><ul>
            <li v-for="reason in result.eligibilityReasons" :key="reason">
              {{ reasonLabels[reason] }}
            </li>
          </ul>
          <ul>
            <template v-for="item in result.contributions" :key="item.requirementId"
              ><li
                v-if="
                  item.kind === 'HARD' &&
                  (item.execution.status !== 'DONE' || item.execution.judgment.verdict !== 'met')
                "
              >
                {{
                  content.jobs
                    .find((job) => job.id === id)
                    ?.requirements.find(
                      (requirement) => requirement.stableId === item.requirementId,
                    )?.description ?? '要求说明未提供'
                }}：{{
                  item.execution.status === 'DONE' ? item.execution.judgment.reason : '未完成判断'
                }}
              </li></template
            >
          </ul>
          <RequirementJudgments :result="result" :content="content"
        /></template>
      </article>
    </section>
    <section aria-labelledby="ineligible-title">
      <h2 id="ineligible-title">不符合硬条件</h2>
      <details>
        <summary>展开不符合硬条件的岗位</summary>
        <p v-if="!content.ranking.ineligible.length">没有不符合硬条件的岗位。</p>
        <article v-for="id in content.ranking.ineligible" :key="id">
          <h3>{{ content.jobs.find((job) => job.id === id)?.title ?? '岗位信息未提供' }}</h3>
          <template
            v-for="result in content.ranking.results.filter((item) => item.jobVersionId === id)"
            :key="result.jobVersionId"
            ><ul>
              <template v-for="item in result.contributions" :key="item.requirementId"
                ><li
                  v-if="
                    item.kind === 'HARD' &&
                    item.execution.status === 'DONE' &&
                    item.execution.judgment.verdict === 'unmet'
                  "
                >
                  {{
                    content.jobs
                      .find((job) => job.id === id)
                      ?.requirements.find(
                        (requirement) => requirement.stableId === item.requirementId,
                      )?.description ?? '要求说明未提供'
                  }}：{{ item.execution.judgment.reason }}
                </li></template
              >
            </ul>
            <RequirementJudgments :result="result" :content="content"
          /></template>
        </article>
      </details></section
  ></template>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
article {
  padding: var(--space-6);
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius);
  margin-block: var(--space-4);
}
h3 {
  margin-top: 0;
}
summary {
  cursor: pointer;
}
</style>
