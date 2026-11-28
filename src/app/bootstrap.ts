import { z } from 'zod';

export async function bootstrap() {
  // 动态装配保证严格CSP的无JIT配置先于任何业务Schema求值。
  z.config({ jitless: true });
  const { mountApplication } = await import('./createApplication');
  await mountApplication();
}
