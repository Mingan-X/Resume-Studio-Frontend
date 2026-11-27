<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { localTime } from '@/shared/lib/localTime';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import RequestState from '@/shared/ui/RequestState.vue';

import { useResumes } from '../api/useResumes';
import ResumeUpload from './ResumeUpload.vue';

const query = useResumes();
const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? []);
</script>

<template>
  <h1>简历</h1>
  <p>上传后查看解析文本，核对内容与来源位置。</p>
  <ResumeUpload />
  <section aria-labelledby="resumes-title" class="list">
    <h2 id="resumes-title">已上传简历</h2>
    <p class="note">
      当前仅提供简历编号、版本和上传时间。文件名与解析状态暂未提供；新上传会在文本解析成功后保存。
    </p>
    <RequestState
      :pending="query.isPending.value"
      :error="!items.length ? query.error.value : null"
      :empty="!items.length"
      empty-text="还没有简历，上传一份PDF或DOCX开始。"
      @retry="query.refetch()"
    >
      <div class="table-scroll">
        <table>
          <caption class="sr-only">
            简历版本列表
          </caption>
          <thead>
            <tr>
              <th scope="col">简历编号</th>
              <th scope="col">上传时间</th>
              <th scope="col">版本</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>
                <time :datetime="item.createdAt" :title="item.createdAt">{{
                  localTime(item.createdAt)
                }}</time>
              </td>
              <td>{{ item.version }}</td>
              <td>
                <RouterLink
                  :to="{ path: `/resumes/${item.id}`, query: { versionId: item.latestVersionId } }"
                  >查看文本</RouterLink
                >
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
    <p v-if="items.length && query.isFetching.value" role="status">正在更新列表…</p>
    <button
      v-if="query.hasNextPage.value"
      type="button"
      :disabled="query.isFetching.value"
      @click="query.fetchNextPage()"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.list {
  margin-top: var(--space-8);
}
.note {
  color: var(--text-muted);
}
.table-scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  background: var(--surface);
}
th,
td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  text-align: left;
}
td:first-child {
  overflow-wrap: anywhere;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
