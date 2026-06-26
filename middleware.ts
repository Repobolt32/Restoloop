import type { NextRequest } from 'next/server';
import { NextResponse, URLPattern } from 'next/server';

import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';
import { createServerClient } from '@supabase/ssr';

import pathsConfig from '~/config/paths.config';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets).*)'],
};

export async function middleware(request: NextRequest) {
  // skip middleware for cron jobs
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  // set a unique request ID for each request
  setRequestId(request);

  // apply CSRF protection for mutating requests
  const csrfResponse = await withCsrfMiddleware(request, response);

  // handle patterns for specific routes
  const handlePattern = matchUrlPattern(request.url);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(request, csrfResponse);

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return patternHandlerResponse;
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    csrfResponse.headers.set('x-action-path', request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return csrfResponse;
}

async function getUser(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return supabase.auth.getUser();
}

async function withCsrfMiddleware(
  request: NextRequest,
  response = new NextResponse(),
) {
  // set up CSRF protection
  const csrfProtect = createCsrfProtect({
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      name: CSRF_SECRET_COOKIE,
    },
    // ignore CSRF errors for server actions since protection is built-in
    ignoreMethods: isServerAction(request)
      ? ['POST']
      : // always ignore GET, HEAD, and OPTIONS requests
      ['GET', 'HEAD', 'OPTIONS'],
  });

  try {
    await csrfProtect(request, response);

    return response;
  } catch (error) {
    // if there is a CSRF error, return a 403 response
    if (error instanceof CsrfError) {
      return NextResponse.json('Invalid CSRF token', {
        status: 401,
      });
    }

    throw error;
  }
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}

/**
 * Define URL patterns and their corresponding handlers.
 */
function getPatterns() {
  return [
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        // the user is logged out, so we don't need to do anything
        if (!data?.user) {
          return;
        }

        // User is logged in — redirect to home page.
        return NextResponse.redirect(
          new URL(pathsConfig.app.home, req.nextUrl.origin).href,
        );
      },
    },
    {
      pattern: new URLPattern({ pathname: '/home/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        const origin = req.nextUrl.origin;
        const next = req.nextUrl.pathname;

        // If user is not logged in, redirect to sign in page.
        if (!data?.user) {
          const signIn = pathsConfig.auth.signIn;
          const redirectPath = `${signIn}?next=${next}`;

          return NextResponse.redirect(new URL(redirectPath, origin).href);
        }
      },
    },
  ];
}

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
function matchUrlPattern(url: string) {
  const patterns = getPatterns();
  const input = url.split('?')[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}
