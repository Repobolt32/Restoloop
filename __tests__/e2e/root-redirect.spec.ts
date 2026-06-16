import { test, expect } from '@playwright/test';

test.describe('Root page redirect @unauthenticated', () => {
  test('redirects unauthenticated user to restoloop.com', async ({ request }) => {
    const response = await request.get('/', {
      maxRedirects: 0,
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('restoloop.com');
  });
});
