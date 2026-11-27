<script setup lang="ts">
import type { ReportContent } from '../model/contracts';
import { reportErrorLabel } from '../model/labels';
import RequirementJudgments from './RequirementJudgments.vue';
defineProps<{ content: ReportContent }>();
const shortfallLabels = {
  CANDIDATE_COUNT_BELOW_TEN: '候选岗位不足10个',
  INELIGIBLE_CANDIDATES: '部分岗位不符合硬条件',
  PENDING_CANDIDATES: '部分岗位仍需核实',
};
</script>
<template>
  <section aria-labelledby="recommend-title">
    <h2 id="recommend-title">推荐岗位</h2>
    <p>按后端返回的推荐顺序展示，分数、覆盖率和上界均来自已保存结果。</p>
    <template v-if="content.ranking"
      ><aside v-if="content.ranking.shortfall.missing">
        <p>推荐不足10条，缺少 {{ content.ranking.shortfall.missing }} 条。</p>
        <ul>
          <li v-for="reason in content.ranking.shortfall.reasons" :key="reason">
            {{ shortfallLabels[reason] }}
          </li>
        </ul>
      </aside>
      <p v-if="!content.ranking.top10.length">本次没有可推荐的岗位。</p>
      <article v-for="id in content.ranking.top10" :key="id" class="recommendation">
        <h3>{{ content.jobs.find((job) => job.id === id)?.title ?? '岗位信息未提供' }}</h3>
        <template
          v-for="result in content.ranking.results.filter((item) => item.jobVersionId === id)"
          :key="result.jobVersionId"
          ><p class="metrics">
            {{ result.total ?? '—' }}分 · 覆盖率{{ result.coverage ?? '—' }}% · 上界{{
              result.upperBound ?? '—'
            }}
          </p>
          <details>
            <summary>分数、覆盖率与上界说明</summary>
            <p>
              分数是当前证据支持的结果；覆盖率表示已知判断覆盖情况；上界表示未确定部分满足时的可能上限。均使用后端结果，不代表录用概率。
            </p>
          </details>
          <h4>主要差距与待补证据</h4>
          <ul>
            <template v-for="contribution in result.contributions" :key="contribution.requirementId"
              ><li
                v-if="
                  contribution.execution.status !== 'DONE' ||
                  contribution.execution.judgment.verdict !== 'met'
                "
              >
                {{
                  content.jobs
                    .find((job) => job.id === id)
                    ?.requirements.find((item) => item.stableId === contribution.requirementId)
                    ?.description ?? '要求说明未提供'
                }}：{{
                  contribution.execution.status !== 'DONE'
                    ? '尚未完成判断'
                    : contribution.execution.judgment.reason
                }}
              </li></template
            >
          </ul>
          <RequirementJudgments :result="result" :content="content"
        /></template>
      </article>
    </template>
    <p v-else>
      推荐结果不可用：{{ reportErrorLabel(content.sectionErrors.matching) || '未提供评分结果' }}
    </p>
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
.recommendation {
  padding: var(--space-6);
  margin-block: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
h3 {
  margin-top: 0;
}
.metrics {
  font-size: 1.15rem;
  font-weight: 650;
}
aside {
  background: var(--brand-soft);
  padding: var(--space-4);
}
</style>
