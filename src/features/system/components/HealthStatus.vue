<script setup lang="ts">
import { useHealth } from '../api/useHealth';

const { data, error, isPending, isFetching, refetch } = useHealth();
</script>

<template>
  <section class="health" aria-labelledby="health-title" aria-live="polite" :aria-busy="isFetching">
    <div class="health-heading">
      <h2 id="health-title">服务连接</h2>
      <button type="button" :disabled="isFetching" @click="refetch()">重新检查</button>
    </div>
    <p v-if="isPending" role="status">正在检查服务连接…</p>
    <div v-else-if="error" role="alert">
      <p class="error">{{ error.message }}</p>
    </div>
    <dl v-else-if="data">
      <div>
        <dt>状态</dt>
        <dd class="success">已连接（{{ data.status }}）</dd>
      </div>
      <div>
        <dt>运行环境</dt>
        <dd>{{ data.environment }}</dd>
      </div>
    </dl>
    <p class="note">连接成功仅表示服务可响应，分析所需的其他服务仍需单独检查。</p>
  </section>
</template>

<style scoped>
.health {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-6);
  max-width: 48rem;
}
.health-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
h2 {
  margin: 0;
  font-size: 1.25rem;
}
dl {
  display: flex;
  gap: var(--space-8);
  margin-block: var(--space-6);
}
dt,
.note {
  color: var(--text-muted);
}
dd {
  margin: var(--space-2) 0 0;
  font-weight: 600;
}
.success {
  color: var(--success);
}
.error {
  color: var(--danger);
}
.note {
  font-size: 0.875rem;
  line-height: 1.7;
  margin-bottom: 0;
}
</style>
