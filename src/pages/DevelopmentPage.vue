<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>
<template>
  <h1>{{ route.meta.title }}</h1>
  <p>功能开发中</p>
</template>
