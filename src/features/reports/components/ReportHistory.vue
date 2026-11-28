<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { localTime } from '@/shared/lib/localTime';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import RequestState from '@/shared/ui/RequestState.vue';

import { useReportHistory } from '../api/useReportHistory';
const props = withDefaults(defineProps<{ reportId?: string }>(), { reportId: '' });
const query = useReportHistory(() => props.reportId);
const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? []);
</script>
<template>
  <section aria-label="报告版本历史">
    <h2>{{ reportId ? '本次分析的报告版本' : '报告历史' }}</h2>
    <RequestState
      :pending="query.isPending.value"
      :error="items.length ? null : query.error.value"
      :empty="!items.length"
      empty-text="还没有报告，完成一次分析后可在这里查看。"
      @retry="query.refetch()"
      ><div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>报告</th>
              <th>时间</th>
              <th>状态</th>
              <th>来源</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <RouterLink :to="`/reports/${item.id}`"
                  >版本 {{ item.revision }} · {{ item.id }}</RouterLink
                >
              </td>
              <td>
                <time :datetime="item.createdAt" :title="item.createdAt">{{
                  localTime(item.createdAt)
                }}</time>
              </td>
              <td>
                {{ item.status === 'PARTIAL' ? '部分完成' : '已完成' }} · 推荐
                {{ item.topCount }} 个
              </td>
              <td>
                <RouterLink v-if="item.sourceReportId" :to="`/reports/${item.sourceReportId}`"
                  >来源报告</RouterLink
                ><span v-else>初始报告</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div></RequestState
    ><ErrorNotice
      v-if="items.length && query.error.value"
      :error="query.error.value"
      @retry="query.fetchNextPage()"
    /><button
      v-if="query.hasNextPage.value"
      type="button"
      :disabled="query.isFetching.value"
      @click="query.fetchNextPage()"
    >
      加载更多报告
    </button>
  </section>
</template>
<style scoped>
section {
  margin-top: var(--space-8);
}
.table-scroll {
  overflow-x: auto;
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
  overflow-wrap: anywhere;
}
</style>
