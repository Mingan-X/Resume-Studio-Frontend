import { http, HttpResponse } from 'msw';

import { sessionFixture } from './authHandlers';
export function authFlowHandlers() {
  let logged = false;
  return [
    http.get('*/api/v1/auth/session', () =>
      HttpResponse.json({ ...sessionFixture, user: logged ? sessionFixture.user : null }),
    ),
    http.post('*/api/v1/auth/login', ({ request }) => {
      if (request.headers.get('X-CSRF-Token') !== sessionFixture.csrfToken)
        return HttpResponse.json(
          {
            code: 'FORBIDDEN',
            message: '缺少请求证明',
            retryable: false,
            requestId: '00000000-0000-4000-8000-000000000001',
          },
          { status: 403 },
        );
      logged = true;
      return HttpResponse.json({ ...sessionFixture, csrfToken: 'f'.repeat(64) });
    }),
    http.post('*/api/v1/auth/logout', ({ request }) => {
      if (request.headers.get('X-CSRF-Token') !== 'f'.repeat(64))
        return HttpResponse.json(
          {
            code: 'FORBIDDEN',
            message: '缺少请求证明',
            retryable: false,
            requestId: '00000000-0000-4000-8000-000000000001',
          },
          { status: 403 },
        );
      logged = false;
      return HttpResponse.json({ loggedOut: true });
    }),
  ];
}
