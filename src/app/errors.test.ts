import { expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { globalError, installErrorHandlers, reportError } from './errors';

it('全局异常仅展示固定安全文案并清理事件监听', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const app = createApp({ template: '<div />' });
  installErrorHandlers(app);
  app.mount(document.createElement('div'));
  reportError(new Error('private resume text'));
  expect(globalError.value?.message).not.toContain('private');
  expect(JSON.stringify(log.mock.calls)).not.toContain('private');
  expect(add).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  expect(app.config.errorHandler).toBe(reportError);
  app.unmount();
  expect(remove).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  globalError.value = null;
});
