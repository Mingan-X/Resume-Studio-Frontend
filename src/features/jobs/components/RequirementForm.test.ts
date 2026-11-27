import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/api/errors';

import { jobFixture } from '../../../../tests/mocks/fixtures/jobs';
import RequirementForm from './RequirementForm.vue';

describe('要求确认表单', () => {
  it('引用所选原文的实际区间，权重原样提交不归一化', async () => {
    const wrapper = mount(RequirementForm, { props: { job: jobFixture } });
    await wrapper.get('#requirement-description').setValue('测试要求');
    await wrapper.get('#requirement-weight').setValue(2.75);
    const source = wrapper.get('#requirement-source').element;
    if (!(source instanceof HTMLTextAreaElement)) throw new Error('source missing');
    source.setSelectionRange(2, 6);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '引用所选文字')
      ?.trigger('click');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      weight: 2.75,
      sourceRef: {
        start: 2,
        end: 6,
        quote: jobFixture.document.blocks[0]?.text.slice(2, 6),
        sourceVersionId: jobFixture.id,
      },
    });
    wrapper.unmount();
  });
  it('负权重拒绝提交，后端字段错误留在权重控件下', async () => {
    const wrapper = mount(RequirementForm, {
      props: {
        job: jobFixture,
        error: new AppError({
          kind: 'http',
          code: 'VALIDATION_ERROR',
          message: '无效输入',
          retryable: false,
          details: { fields: [{ path: 'requirement.weight', code: 'NEGATIVE' }] },
        }),
      },
    });
    await wrapper.get('#requirement-description').setValue('测试要求');
    await wrapper.get('#requirement-weight').setValue(-1);
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.get('#requirement-weight').element.nextElementSibling?.textContent).toContain(
      '非负',
    );
    wrapper.unmount();
  });
});
