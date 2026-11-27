<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { localTime } from '@/shared/lib/localTime';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import RequestState from '@/shared/ui/RequestState.vue';

import { useJobs } from '../api/useJobs';
import { indexLabel, publicationLabel } from '../model/labels';

const query = useJobs();
const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? []);
</script>
<template>
  <h1>岗位</h1>
  <p>准备职位说明，核对要求后发布。只有索引可用的版本会参与召回。</p>
  <RouterLink to="/jobs/new">新建岗位</RouterLink>
  <RequestState
    :pending="query.isPending.value"
    :error="items.length ? null : query.error.value"
    :empty="!items.length"
    empty-text="还没有岗位，新建一份职位说明开始。"
    @retry="query.refetch()"
  >
    <div class="table-scroll">
      <table>
        <caption>
          岗位版本与索引状态
        </caption>
        <thead>
          <tr>
            <th>岗位</th>
            <th>版本</th>
            <th>发布状态</th>
            <th>索引状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <RouterLink :to="`/jobs/${item.id}`">{{ item.latestVersion.title }}</RouterLink>
            </td>
            <td>{{ item.latestVersion.version }}</td>
            <td>{{ publicationLabel(item.latestVersion.status) }}</td>
            <td>
              {{ indexLabel(item.latestVersion.indexStatus) }}
              <p v-if="item.latestVersion.indexStatus !== 'READY'">未参与召回</p>
            </td>
            <td>
              <time :datetime="item.createdAt" :title="item.createdAt">{{
                localTime(item.createdAt)
              }}</time>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </RequestState>
  <ErrorNotice
    v-if="items.length && query.error.value"
    :error="query.error.value"
    @retry="query.fetchNextPage()"
  />
  <button
    v-if="query.hasNextPage.value"
    type="button"
    :disabled="query.isFetching.value"
    @click="query.fetchNextPage()"
  >
    加载更多
  </button>
</template>
<style scoped>
.table-scroll {
  overflow-x: auto;
  margin-top: var(--space-6);
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}
th,
td {
  text-align: left;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}
caption {
  text-align: left;
  padding-bottom: var(--space-2);
}
td p {
  color: var(--text-muted);
  margin: var(--space-2) 0 0;
}
</style>
