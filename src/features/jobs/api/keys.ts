export const jobKeys = {
  lists: ['jobs', 'list'] as const,
  detail: (id: string, version = '') => ['jobs', 'detail', id, version] as const,
};
