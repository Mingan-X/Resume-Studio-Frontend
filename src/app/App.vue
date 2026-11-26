<script setup lang="ts">
import { HealthStatus } from '@/features/system';
</script>

<template>
  <main>
    <h1>Resume Studio</h1>
    <p>简历分析工作台</p>
    <HealthStatus />
  </main>
</template>

<style scoped>
main {
  max-width: 80rem;
  margin-inline: auto;
  padding: var(--space-8);
}
h1 {
  font-size: 2rem;
  margin-bottom: 0;
}
main > p {
  margin-top: var(--space-2);
  margin-bottom: var(--space-8);
  color: var(--text-muted);
}
</style>
