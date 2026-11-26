import { http, HttpResponse } from 'msw';

export const healthyResponse = { status: 'ok', service: 'api', environment: 'test' } as const;
export const handlers = [http.get('*/health', () => HttpResponse.json(healthyResponse))];
