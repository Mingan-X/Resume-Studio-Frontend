import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import { useUnsavedChanges } from './useUnsavedChanges';

it('未保存时拦截刷新，清除脏状态或卸载后放行', () => {
  const dirty = ref(true);
  const wrapper = mount(
    defineComponent({
      setup() {
        useUnsavedChanges(dirty);
        return () => null;
      },
    }),
  );
  const first = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(first);
  expect(first.defaultPrevented).toBe(true);
  dirty.value = false;
  const second = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(second);
  expect(second.defaultPrevented).toBe(false);
  wrapper.unmount();
  dirty.value = true;
  const third = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(third);
  expect(third.defaultPrevented).toBe(false);
});
