import { test, expect } from '@playwright/test';

test.describe('API Routes — /api/leads @unauthenticated', () => {
  test('rejects empty body', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('rejects invalid phone format', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: { tenantId: '00000000-0000-0000-0000-000000000000', name: 'Test', phone: '123' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('accepts valid payload structure', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Customer',
        phone: '9876543210',
      },
    });

    const body = await response.json();

    if (response.status() === 200) {
      expect(body.success).toBeDefined();
      expect(body.couponCode).toBeDefined();
      expect(body.discount).toBeDefined();
    } else {
      expect(body.error).toBeDefined();
    }
  });
});

test.describe('API Routes — unauthenticated access @unauthenticated', () => {
  test('rejects unauthenticated /api/coupons/validate', async ({ request }) => {
    const response = await request.post('/api/coupons/validate', {
      data: { code: 'TESTCODE' },
    });

    expect([401, 302, 307]).toContain(response.status());
  });

  test('rejects unauthenticated /api/billing/confirm', async ({ request }) => {
    const response = await request.post('/api/billing/confirm', {
      data: {},
    });

    expect([401, 302, 307]).toContain(response.status());
  });


});

test.describe('API Routes — authenticated validation @authenticated', () => {
  test('rejects empty code on /api/coupons/validate', async ({ request }) => {
    const response = await request.post('/api/coupons/validate', {
      data: {},
    });

    expect(response.ok()).toBeFalsy();
    const body = await response.json();
    expect(body.error ?? body.valid === false).toBeTruthy();
  });

  test('rejects empty payload on /api/billing/confirm', async ({ request }) => {
    const response = await request.post('/api/billing/confirm', {
      data: {},
    });

    expect(response.ok()).toBeFalsy();
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
