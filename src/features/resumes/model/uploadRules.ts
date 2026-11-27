import { z } from 'zod';

// 来源：后端docs/api.md“简历上传与查询”，10 MiB，不把PDF页数限制套用到DOCX。
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const resumeFileSchema = z
  .instanceof(File)
  .refine((file) => /\.(pdf|docx)$/i.test(file.name), '不支持该格式，请选择PDF或DOCX文件。')
  .refine((file) => file.size > 0, '文件为空，请重新选择。')
  .refine((file) => file.size <= MAX_RESUME_BYTES, '文件超过10 MiB上限，请缩小文件后重试。');
