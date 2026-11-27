<script setup lang="ts">
import { computed } from 'vue';

import type { ReportContent } from '../model/contracts';
import { dimensionLabels, reportErrorLabel } from '../model/labels';
import EvidenceList from './EvidenceList.vue';
import ProfileChart from './ProfileChart.vue';
const props = defineProps<{ content: ReportContent }>();
const missing = computed(
  () =>
    props.content.profile?.judgments
      .filter((item) => item.status === 'unknown')
      .map((item) => dimensionLabels[item.dimension]) ?? [],
);
</script>
<template>
  <section aria-labelledby="profile-title">
    <h2 id="profile-title">六维画像</h2>
    <template v-if="content.profile"
      ><p v-if="missing.length" class="unknown">
        证据不足：{{ missing.join('、') }}。这些维度不绘点或连到零。
      </p>
      <ProfileChart :profile="content.profile" />
      <div class="table-scroll">
        <table>
          <caption>
            六维画像等价表格
          </caption>
          <thead>
            <tr>
              <th>维度</th>
              <th>状态 / 等级</th>
              <th>后端分值</th>
              <th>理由与证据</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="judgment in content.profile.judgments" :key="judgment.dimension">
              <th scope="row">{{ dimensionLabels[judgment.dimension] }}</th>
              <td>
                {{ judgment.status === 'unknown' ? '证据不足' : `已评估 · 等级 ${judgment.level}` }}
              </td>
              <td>
                {{
                  judgment.status === 'unknown'
                    ? '—（证据不足）'
                    : (content.profile.scores.find((item) => item.dimension === judgment.dimension)
                        ?.score ?? '—')
                }}
              </td>
              <td>
                {{ judgment.reason
                }}<EvidenceList
                  :references="judgment.evidenceRefs"
                  :document="content.extractedDocument"
                />
              </td>
            </tr>
          </tbody>
        </table></div
    ></template>
    <p v-else>
      六维画像不可用：{{ reportErrorLabel(content.sectionErrors.profile) || '未提供画像结果' }}
    </p>
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
.unknown {
  color: var(--unknown);
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}
th,
td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
.table-scroll {
  overflow-x: auto;
}
</style>
