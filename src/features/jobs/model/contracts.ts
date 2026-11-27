import { z } from 'zod';

import { zGetJobResponse, zListJobsResponse } from '@/generated/zod.gen';

// 兼容后端增加展示枚举；其余字段仍由生成契约约束，未知状态不允许编辑/发布。
export const jobSchema = zGetJobResponse.extend({ status: z.string(), indexStatus: z.string() });
export const jobsSchema = zListJobsResponse.extend({
  items: z.array(zListJobsResponse.shape.items.element.extend({ latestVersion: jobSchema })),
});
export type JobVersion = z.infer<typeof jobSchema>;
export type Requirement = JobVersion['requirements'][number];
export type Dimension = JobVersion['dimensionWeights'][number]['dimension'];
export type { ConfirmJobData, CreateJobData, EditJobDraftData } from '@/generated/types.gen';
export {
  zCreateJobBody as createJobSchema,
  zEditJobDraftBody as editJobSchema,
} from '@/generated/zod.gen';
