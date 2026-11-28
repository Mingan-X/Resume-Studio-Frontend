import { http, HttpResponse } from 'msw';
export const authUser = { id: '50000000-0000-4000-8000-000000000001', username: 'synthetic-user' };
export const sessionFixture = {
  user: authUser,
  csrfToken: 'e'.repeat(64),
  expiresAt: '2030-01-01T00:00:00.000Z',
};
export const authHandlers = [
  http.get('*/api/v1/auth/session', () => HttpResponse.json(sessionFixture)),
  http.get('*/api/v1/auth/me', () => HttpResponse.json(sessionFixture)),
  http.post('*/api/v1/auth/login', () =>
    HttpResponse.json({ ...sessionFixture, csrfToken: 'f'.repeat(64) }),
  ),
  http.post('*/api/v1/auth/logout', () => HttpResponse.json({ loggedOut: true })),
];
