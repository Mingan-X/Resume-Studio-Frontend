import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { z } from 'zod';

import { handlers } from './handlers';

export async function startMocks() {
  const scenario = z
    .enum(['healthy', 'offline'])
    .catch('healthy')
    .parse(new URLSearchParams(window.location.search).get('scenario'));
  const worker = setupWorker(...handlers);
  if (scenario === 'offline') worker.use(http.get('*/health', () => HttpResponse.error()));
  await worker.start({ quiet: true, onUnhandledFrame: 'bypass' });
}
