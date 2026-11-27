import type { MaybeRefOrGetter } from 'vue';
import { onScopeDispose, toValue } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

export function useUnsavedChanges(dirty: MaybeRefOrGetter<boolean>) {
  onBeforeRouteLeave(
    () => !toValue(dirty) || window.confirm('有未保存的修改，确定离开并放弃这些修改？'),
  );
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (toValue(dirty)) {
      event.preventDefault();
      event.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', beforeUnload);
  onScopeDispose(() => window.removeEventListener('beforeunload', beforeUnload));
}
