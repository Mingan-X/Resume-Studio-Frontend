<script setup lang="ts">
import { ElButton } from 'element-plus';
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

import { HealthStatus } from '@/features/system';

const showHealth = ref(false);
const navigation = [
  { path: '/resumes', title: '简历' },
  { path: '/jobs', title: '岗位' },
  { path: '/analyses/new', title: '发起分析' },
  { path: '/reports', title: '报告历史' },
];
</script>

<template>
  <a class="skip" href="#main-content">跳到内容</a>
  <header>
    <RouterLink class="brand" to="/resumes">Resume Studio</RouterLink>
    <span>简历分析工作台</span>
    <RouterLink to="/login">登录</RouterLink>
  </header>
  <div class="workspace">
    <aside>
      <nav aria-label="主导航">
        <RouterLink v-for="item in navigation" :key="item.path" :to="item.path">{{
          item.title
        }}</RouterLink>
      </nav>
      <ElButton :aria-expanded="showHealth" @click="showHealth = !showHealth">
        检查服务连接
      </ElButton>
    </aside>
    <main id="main-content" tabindex="-1">
      <RouterView />
      <div v-if="showHealth" class="diagnostics"><HealthStatus /></div>
    </main>
  </div>
</template>

<style scoped>
header {
  min-height: 4.5rem;
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-8);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
header > a:last-child {
  margin-left: auto;
}
.brand {
  font-size: 1.25rem;
  font-weight: 750;
  text-decoration: none;
  color: var(--text);
}
header > span {
  color: var(--text-muted);
}
.workspace {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  min-height: calc(100vh - 4.5rem);
}
aside {
  padding: var(--space-6) var(--space-4);
  border-right: 1px solid var(--border);
  background: var(--surface);
}
nav {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}
nav a {
  display: block;
  text-decoration: none;
  color: var(--text-muted);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius);
}
nav a.router-link-active {
  color: var(--brand);
  background: var(--brand-soft);
  font-weight: 650;
}
main {
  padding: var(--space-8);
  min-width: 0;
}
.diagnostics {
  margin-top: var(--space-8);
}
.skip {
  position: absolute;
  transform: translateY(-150%);
  background: var(--surface);
  padding: var(--space-2);
}
.skip:focus {
  transform: translateY(0);
}
@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 10rem minmax(0, 1fr);
  }
  header > span {
    display: none;
  }
  main {
    padding: var(--space-6);
  }
}
</style>
