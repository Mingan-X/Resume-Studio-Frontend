import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

import { zGetResumeVersionPath } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';

import { resumeVersionSchema } from '../model/contracts';
import { resumeKeys } from './keys';

export function useResumeVersion(
  resumeId: MaybeRefOrGetter<string>,
  versionId: MaybeRefOrGetter<string>,
) {
  const path = computed(() =>
    zGetResumeVersionPath.safeParse({ resumeId: toValue(resumeId), versionId: toValue(versionId) }),
  );
  return useQuery({
    queryKey: computed(() => resumeKeys.version(toValue(resumeId), toValue(versionId))),
    enabled: computed(() => path.value.success),
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest(
        `/resumes/${encodeURIComponent(toValue(resumeId))}/versions/${encodeURIComponent(toValue(versionId))}`,
        resumeVersionSchema,
        { signal },
      ),
  });
}
