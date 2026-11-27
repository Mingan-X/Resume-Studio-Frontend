export const resumeKeys = {
  lists: ['resumes', 'list'] as const,
  version: (resumeId: string, versionId: string) =>
    ['resumes', 'version', resumeId, versionId] as const,
};
