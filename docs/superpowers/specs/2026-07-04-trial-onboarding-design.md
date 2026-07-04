# Design Spec: Low-Friction Account-First Onboarding Flow

This specification covers transitioning the Restoloop signup flow to a low-friction Account-First model. More complex trial payment mechanics, header widgets, and warning components will be added after further research.

## Requirements

1. **Low-Friction Signup Flow**:
   * When an owner registers on `/signup`, they enter their email, password, and restaurant details.
   * On form submission, they are automatically logged in and redirected directly to the main dashboard page at `/dashboard`.
   * They should not be blocked by any mandatory upfront paywall during signup.

2. **Default Database State**:
   * New registrations default to `plan = 'free'` and `credits = 0`.
   * The owner can navigate through all sections of the dashboard to explore features.
