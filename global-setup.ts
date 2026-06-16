import type { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://oggwcgygkwxywmjdnaef.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3djZ3lna3d4eXdtamRuYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Nzc3NDMsImV4cCI6MjA4ODQ1Mzc0M30.ebxsZBU4Zn5lMc8YU35mFLj3r3D7MrIwhgDE3oFq7n4';
const TEST_EMAIL = 'e2e-test@restoloop.com';
const TEST_PASSWORD = 'TestPassword123';
const AUTH_COOKIE_NAME = 'sb-oggwcgygkwxywmjdnaef-auth-token';
const STORAGE_STATE_PATH = path.join(__dirname, 'storage-state.json');

async function globalSetup(_config: FullConfig) {
  // Sign in via Supabase REST API
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Supabase sign-in failed: ${response.status} ${err}`);
  }

  const session = await response.json();

  // Build storage state with the auth cookie
  const storageState = {
    cookies: [
      {
        name: AUTH_COOKIE_NAME,
        value: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user,
        }),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
        expires: session.expires_at,
      },
    ],
    origins: [],
  };

  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState, null, 2));
  console.log('[global-setup] Auth storage state written to', STORAGE_STATE_PATH);
}

export default globalSetup;
