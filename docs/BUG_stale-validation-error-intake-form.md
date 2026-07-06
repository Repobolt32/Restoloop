# Bug: Stale Validation Error in Intake Form

**File:** `src/app/form/[slug]/IntakeForm.tsx`
**Severity:** Minor (UI/UX)
**Found:** Jul 6, 2026 (browser testing)

---

## Symptom

When a user first submits the intake form with an **invalid phone number**, a red error banner appears:
> "WhatsApp number must start with +91 followed by 10 digits."

If the user then submits again with an **empty name** (but valid phone), the phone error banner **persists** — it does not disappear even though the phone is now valid.

![Visual flow: C5 invalid phone → error shown → C6 empty name submit → error still visible]

## Root Cause

The error is cleared in `handleSubmit` at line 19 via `setError('')`. However, the **name input has the `required` HTML attribute** (line 91):

```tsx
<input ... required ... />
```

When the name is empty and the user clicks submit, the **browser's native HTML5 form validation fires first**, preventing the `handleSubmit` React handler from executing. Since the handler never runs, `setError('')` is never called, and the stale error from the previous submission remains visible.

## Code Flow

```
User submits invalid phone (+9199)
  → handleSubmit() runs
  → line 19: setError('')          ← clears previous error (was empty)
  → line 22-28: client validation fails
  → line 26: setError('WhatsApp number...')   ← sets new error
  → error banner shows

User submits empty name with valid phone (+919999999992)
  → Browser sees empty <input required>
  → Browser shows "Please fill out this field" tooltip
  → handleSubmit() NEVER RUNS        ← because browser blocks submission
  → setError('') NEVER CALLED        ← stale error remains from step 1
```

## Fix Options

### Option A: Clear error on input change (recommended)

Simplest fix. Clear the error whenever the user types in any form field. This requires adding `onChange` handlers to the inputs.

Add at the top of the component:

```tsx
const clearError = () => { if (error) setError('') }
```

Then on every input: `onChange={clearError}`.

This is ~5 lines total and covers all cases (empty name, any other validation error).

### Option B: Use `form.noValidate` + manual validation

Remove the `required` attribute from the name input and handle emptiness in the client-side code instead. This ensures our handler always fires. But this duplicates what HTML5 already does for free.

### Option C: `useEffect` to clear on interaction

```tsx
useEffect(() => { if (error) setError('') }, [name, phone, ...])
```

More complex, needs tracking all form values.

---

## How to Reproduce

1. Navigate to `/form/{slug}`
2. Enter invalid phone: `1234567890` (no +91 prefix)
3. Click "Get WhatsApp Coupon" → error banner appears
4. Leave name empty, change phone to `+919999999992` (valid)
5. Click "Get WhatsApp Coupon" → browser shows "Please fill out this field" tooltip
6. Error banner from step 3 is still visible

## Expected Behavior

When a user fixes the input and resubmits, stale error banners should not persist. Either:
- The error should clear when the user modifies the offending field, OR
- The error should clear before the next validation attempt
