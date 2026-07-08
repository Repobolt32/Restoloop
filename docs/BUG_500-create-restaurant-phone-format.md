# BUG: 500 error on create restaurant when WhatsApp number has +91 prefix

## Environment
- Production (Vercel): `restoloop-owner.vercel.app`
- Commit: `3e4464f`

## Symptom
Clicking "Create Restaurant" shows a 500 error page ("This page couldn't load. A server error occurred. Reload to try again.").

Console errors:
```
create:1 Failed to load resource: the server responded with a status of 500 ()
Uncaught Error: An error occurred in the Server Components render.
```

Vercel logs show:
```
POST /dashboard/create → 500
ZodError: "Invalid string: must match pattern /^91\d{10}$/"
  path: ["whatsappNumber"]
```

## Root Cause
`src/app/dashboard/create/actions.ts:29` — `schema.parse()` throws an unhandled ZodError when the WhatsApp number doesn't match `/^91\d{10}$/`. Users commonly enter `+919876543210` (with `+`), which fails validation.

The ZodError is not caught — it propagates as an unhandled exception in the server action, causing a 500 response.

## Fix
Two changes needed in `src/app/dashboard/create/actions.ts`:

1. **Normalize phone input** — strip `+`, spaces, dashes before validation
2. **Use safeParse** — catch validation errors and redirect with a friendly message instead of crashing

Additionally, the page (`src/app/dashboard/create/page.tsx`) should display the error from searchParams.

## Code
```ts
// Normalize phone before passing to schema
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1)
  return digits
}

// Use safeParse instead of parse
const raw = formData.get('whatsappNumber') as string
const parsed = schema.safeParse({
  name: formData.get('name'),
  whatsappNumber: normalizePhone(raw),
  ...
})
if (!parsed.success) {
  redirect(`/dashboard/create?error=${encodeURIComponent('Invalid WhatsApp number. Use format: 919876543210')}`)
}
```
