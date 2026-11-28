import { http, HttpResponse } from 'msw';

import { sessionFixture } from './authHandlers';
export function authFlowHandlers() {
  let logged = false;
  return [
    http.get('*/api/v1/auth/session', () =>
      HttpResponse.json({ ...sessionFixture, user: logged ? sessionFixture.user : null }),
    ),
    http.post('*/api/v1/auth/login', () => {
      logged = true;
      return HttpResponse.json({ ...sessionFixture, csrfToken: 'f'.repeat(64) });
    }),
    http.post('*/api/v1/auth/logout', () => {
      logged = false;
      return HttpResponse.json({ loggedOut: true });
    }),
  ];
}
