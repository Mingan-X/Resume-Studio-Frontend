<script setup lang="ts">
import type { ReportContent } from '../model/contracts';
import EvidenceList from './EvidenceList.vue';
defineProps<{ content: ReportContent }>();
</script>
<template>
  <section aria-labelledby="structured-title">
    <h2 id="structured-title">结构化简历</h2>
    <h3>教育</h3>
    <p v-if="!content.parsedResume.education.length">未识别</p>
    <article v-for="item in content.parsedResume.education" :key="JSON.stringify(item)">
      <p>
        学校：{{ item.institution ?? '未识别' }}；学位：{{ item.degree ?? '未识别' }}；专业：{{
          item.field ?? '未识别'
        }}
      </p>
      <p>{{ item.startDate ?? '未识别' }} 至 {{ item.endDate ?? '未识别' }}</p>
      <EvidenceList :references="item.sourceRefs" :document="content.extractedDocument" />
    </article>
    <h3>工作</h3>
    <p v-if="!content.parsedResume.work.length">未识别</p>
    <article v-for="item in content.parsedResume.work" :key="JSON.stringify(item)">
      <p>{{ item.employer ?? '未识别' }} · {{ item.role ?? '未识别' }}</p>
      <p>
        {{ item.startDate ?? '未识别' }} 至 {{ item.endDate ?? '未识别' }}；在职状态：{{
          item.ongoing === null ? '未识别' : item.ongoing ? '在职' : '已结束'
        }}
      </p>
      <p v-if="!item.responsibilities.length">职责：未识别</p>
      <ul>
        <li v-for="text in item.responsibilities" :key="text">{{ text }}</li>
      </ul>
      <EvidenceList :references="item.sourceRefs" :document="content.extractedDocument" />
    </article>
    <h3>项目</h3>
    <p v-if="!content.parsedResume.projects.length">未识别</p>
    <article v-for="item in content.parsedResume.projects" :key="JSON.stringify(item)">
      <p>{{ item.name ?? '未识别' }} · {{ item.role ?? '未识别' }}</p>
      <p>{{ item.description ?? '未识别' }}</p>
      <p>技术：{{ item.technologies.length ? item.technologies.join('、') : '未识别' }}</p>
      <EvidenceList :references="item.sourceRefs" :document="content.extractedDocument" />
    </article>
    <h3>技能</h3>
    <p v-if="!content.parsedResume.skills.length">未识别</p>
    <article v-for="item in content.parsedResume.skills" :key="JSON.stringify(item)">
      <p>{{ item.name }}：{{ item.context ?? '未识别' }}</p>
      <EvidenceList :references="item.sourceRefs" :document="content.extractedDocument" />
    </article>
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
article {
  padding: var(--space-4);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow-wrap: anywhere;
}
h3 {
  margin-top: var(--space-6);
}
</style>
