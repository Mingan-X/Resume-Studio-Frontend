<script setup lang="ts">
import { useRouter } from 'vue-router';

import { JobForm } from '@/features/jobs';
const router = useRouter();
</script>
<template>
  <h1>新建岗位</h1>
  <JobForm @saved="(job) => router.push(`/jobs/${job.jobId}`)" />
</template>
