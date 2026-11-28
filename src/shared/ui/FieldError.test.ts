import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import FieldError from './FieldError.vue';
it('字段错误关联输入可访问说明并在消失后清除', async () => {
  const wrapper = mount(
    {
      components: { FieldError },
      props: ['message'],
      template:
        '<label for="sample-field">字段</label><input id="sample-field" /><FieldError path="field" :message="message" />',
    },
    { props: { message: '无效值' } },
  );
  const input = wrapper.get('input');
  expect(input.attributes('aria-invalid')).toBe('true');
  expect(input.attributes('aria-describedby')).toBe(wrapper.get('[role="alert"]').attributes('id'));
  await wrapper.setProps({ message: '' });
  expect(input.attributes('aria-invalid')).toBeUndefined();
  wrapper.unmount();
});
