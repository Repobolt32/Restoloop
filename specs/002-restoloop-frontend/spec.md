# Feature Specification: Restoloop Frontend

**Feature Branch**: `002-restoloop-frontend`
**Created**: 2026-05-24
**Status**: Draft
**Input**: PRD v1 — WhatsApp-first customer outreach SaaS for Indian restaurants. Frontend rebuild over existing Supabase + WhatsApp backend.

## User Scenarios & Testing

### User Story 1 — Owner Sign-Up & Authentication (Priority: P1)

Raju, a 45-year-old restaurant owner, discovers Restoloop. He visits the site on his smartphone, signs up with email and password, and lands on the dashboard where he immediately sees his restaurant's KPIs. He can also sign in on subsequent visits, reset his password if forgotten, and sign out.

**Why this priority**: Authentication is the entry point. Without it, no owner can access any feature. All other stories depend on an authenticated session.

**Independent Test**: Can be fully tested by signing up a new account, signing out, signing back in, and triggering a password reset email — all from a 375px-wide mobile viewport. Delivers value immediately: owner gains access to the system.

**Acceptance Scenarios**:

1. **Given** a visitor on the sign-up page, **When** they enter email + password and submit, **Then** an account is created and they are redirected to the dashboard.
2. **Given** an unauthenticated visitor on the sign-in page, **When** they enter valid credentials and submit, **Then** they are redirected to the dashboard.
3. **Given** a user on the sign-in page, **When** they enter wrong credentials, **Then** they see an error message and remain on the sign-in page.
4. **Given** a user who forgot their password, **When** they request a password reset with their registered email, **Then** a reset link is sent to that email.
5. **Given** an authenticated user, **When** they click sign out, **Then** their session ends and they are redirected to the sign-in page.

---

### User Story 2 — Dashboard Overview with KPIs & Activity (Priority: P1)

Raju signs in and arrives at the dashboard. He immediately sees 3 KPI cards — Total Customers, Coupons Sent This Month, Credits Remaining. Below that, an activity feed shows today's birthday customers, recent coupon sends, and a low-credit alert when credits drop below a threshold. He understands the state of his outreach in under 10 seconds.

**Why this priority**: The dashboard is the home screen and primary decision-making surface. It delivers the core value proposition — "understand your outreach at a glance." Tied with Auth for top priority.

**Independent Test**: Sign in as an owner with existing customer and coupon data. Verify all 3 KPI cards render correct values, activity feed shows recent events, and low-credit alert appears when credits are below threshold. Can be tested with seeded test data.

**Acceptance Scenarios**:

1. **Given** an authenticated owner with customers and sent coupons, **When** they load the dashboard, **Then** KPI cards display Total Customers count, Coupons Sent This Month count, and Credits Remaining value within 2 seconds.
2. **Given** an authenticated owner, **When** customers have birthdays today, **Then** the activity feed lists those customers by name.
3. **Given** an authenticated owner with credits below 50, **When** they view the dashboard, **Then** a low-credit alert is prominently displayed.
4. **Given** an authenticated owner on a 375px-wide phone screen, **When** they view the dashboard, **Then** KPI cards stack vertically and all data remains readable without horizontal scroll.

---

### User Story 3 — Customer List Browsing (Priority: P2)

Raju navigates to the Customers page. He sees a table of all his customers showing Name, Phone, Birthday, Last Visit, Visit Count, and Customer Since. He can sort by any column, search by name or phone, and scroll through the full list. He cannot edit customer data here — it's view-only.

**Why this priority**: Customer data is the core asset. Owners need to see who's in their system. It's P2 because an owner could technically use the system without browsing the full list (dashboard shows counts), but it's essential for trust and verification.

**Independent Test**: Sign in as an owner with 100+ customers. Navigate to Customers page. Verify all columns render, click column headers to sort ascending/descending, type in search box to filter by name and phone. Verify no inline editing is possible.

**Acceptance Scenarios**:

1. **Given** an authenticated owner with customers, **When** they navigate to the Customers page, **Then** they see a table with all customers and their details.
2. **Given** the customer table displayed, **When** the owner clicks a column header, **Then** rows sort by that column ascending, and a second click sorts descending.
3. **Given** the customer table displayed, **When** the owner types a name or phone in the search box, **Then** the table filters to show only matching customers.
4. **Given** a restaurant with fewer than 500 customers, **When** the owner views the customer list, **Then** all customers load without pagination.

---

### User Story 4 — Coupon History Viewing (Priority: P2)

Raju navigates to the Coupons page. He sees a read-only list of all coupons that have been sent — Code, Type (welcome/birthday/winback), Discount value, Status, Sent Date, and which Customer received it. He can filter by type. He cannot manually create coupons since they are auto-generated by the backend.

**Why this priority**: Owners need visibility into what coupons were sent. It builds trust in the automation. P2 because coupon viewing is verification, not action-driving. The backend handles sending — this is the transparency layer.

**Independent Test**: Sign in as an owner with sent coupons of various types. Navigate to Coupons page. Verify all columns render correctly. Apply type filter and verify only matching coupons display. Verify no create/edit controls exist.

**Acceptance Scenarios**:

1. **Given** an authenticated owner with sent coupons, **When** they navigate to the Coupons page, **Then** they see a list showing Code, Type, Discount, Status, Sent Date, and Customer for each coupon.
2. **Given** coupons of mixed types exist, **When** the owner filters by "welcome", **Then** only welcome-type coupons are displayed.
3. **Given** the Coupons page, **When** the owner looks for a "Create Coupon" button, **Then** none exists — the list is read-only.

---

### User Story 5 — Restaurant Profile Management (Priority: P3)

Raju navigates to the Profile page. He sees pre-filled fields for his restaurant's name, address, phone, email, and coupon discount values. He can edit any field and save. Changes persist and reflect across the system (e.g., coupon values affect future auto-generated coupons).

**Why this priority**: Profile setup happens once and is rarely changed. It's P3 because the system can function with default values, but it's necessary for personalization and correct coupon amounts.

**Independent Test**: Sign in as an owner. Navigate to Profile. Edit restaurant name and a coupon value. Save. Refresh the page and verify changes persisted. Verify new coupon value appears in the profile form.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they navigate to the Profile page, **Then** all existing restaurant details are pre-filled in editable fields.
2. **Given** the Profile page with edited fields, **When** the owner clicks Save, **Then** changes persist and a success confirmation is shown.
3. **Given** invalid input (e.g., empty restaurant name), **When** the owner tries to save, **Then** a validation error is shown and the invalid field is highlighted.

---

### User Story 6 — Public Customer Intake Form (Priority: P1)

A customer, Priya, dines at Raju's restaurant. She scans a QR code on the table or visits a link that opens the restaurant's intake form. She enters her Name, Phone, and optionally her Birthday and Favorite Dish. Upon submission, a welcome coupon is auto-generated, a WhatsApp message is sent to her phone with the coupon code, and she sees a success screen displaying the coupon. No login is required.

**Why this priority**: The intake form is the top of the funnel — it's how customer data enters the system and how coupons get delivered. Without it, there are no customers and no outreach. It's the primary customer-facing surface.

**Independent Test**: Visit `/form/[slug]` for a known restaurant slug. Fill in the form fields. Submit. Verify success screen with coupon code appears. Verify a WhatsApp message was triggered (check backend logs). Try submitting with missing required fields and verify validation errors.

**Acceptance Scenarios**:

1. **Given** a public visitor at `/form/[slug]` for a valid restaurant, **When** they load the page, **Then** they see an intake form with Name, Phone, Birthday (optional), and Favorite Dish (optional) fields.
2. **Given** the intake form filled with valid Name and Phone, **When** the visitor submits, **Then** a welcome coupon is generated, a WhatsApp message is queued, and a success screen shows the coupon code.
3. **Given** the intake form with an invalid phone number, **When** the visitor submits, **Then** a validation error is shown and no coupon is generated.
4. **Given** a visitor submits the form, **When** the restaurant has zero credits remaining, **Then** the visitor sees a friendly "restaurant not accepting submissions" message.
5. **Given** a visitor at an invalid or non-existent slug, **When** the page loads, **Then** a "restaurant not found" message is displayed.

---

### Edge Cases

- What happens when the Supabase connection fails during sign-up? Show a generic "something went wrong" message, do not expose technical details.
- What happens when the password reset email fails to send? Show a "could not send reset email, try again" message.
- What happens when a customer submits the intake form twice with the same phone number? Deduplicate by phone — if a customer with that phone already exists, do not create a duplicate, but still show the coupon success screen (idempotent behavior).
- What happens when the intake form slug belongs to a deactivated restaurant? Show "restaurant not found" (same as invalid slug — don't leak tenant status).
- What happens when the dashboard loads with zero customers and zero coupons? Show zero states — "No customers yet" in KPI, empty activity feed with "Share your form link to get started" prompt.
- What happens on very slow connections (2G/3G)? Page shells render with loading indicators, data streams in progressively.
- What happens when searching the customer table with no matches? Show "No customers match your search" empty state.
- What happens with a very long restaurant name in the profile? Text truncates with ellipsis in KPI/dashboard contexts; full name shown on Profile page.

## Requirements

### Functional Requirements

**Authentication**
- **FR-001**: System MUST allow restaurant owners to create an account with email and password.
- **FR-002**: System MUST allow restaurant owners to sign in with email and password.
- **FR-003**: System MUST allow restaurant owners to request a password reset via email.
- **FR-004**: System MUST redirect authenticated owners to the dashboard after sign-in/sign-up.
- **FR-005**: System MUST reject invalid credentials with a user-friendly error message that does not reveal whether the email or password was wrong.
- **FR-006**: System MUST end the session when the owner signs out.

**Dashboard**
- **FR-007**: System MUST display a Total Customers KPI card showing the count of all customers for the owner's restaurant.
- **FR-008**: System MUST display a Coupons Sent This Month KPI card showing the count of coupons sent in the current calendar month.
- **FR-009**: System MUST display a Credits Remaining KPI card showing the owner's current credit balance.
- **FR-010**: System MUST display an activity feed showing today's birthday customers, recent coupon sends, and a low-credit alert (below 50 credits).
- **FR-011**: Dashboard KPI cards MUST be readable on a 375px-wide viewport without horizontal scrolling.

**Customers**
- **FR-012**: System MUST display a table of all customers with columns: Name, Phone, Birthday, Last Visit, Visit Count, Customer Since.
- **FR-013**: System MUST allow sorting the table by any column in ascending and descending order.
- **FR-014**: System MUST allow searching/filtering customers by name or phone number.
- **FR-015**: The customer table MUST be view-only with no inline editing capability.
- **FR-016**: System MUST support displaying up to 500 customers without pagination.

**Coupons**
- **FR-017**: System MUST display a read-only list of coupons with columns: Code, Type, Discount, Status, Sent Date, Customer.
- **FR-018**: System MUST allow filtering coupons by type (welcome, birthday, winback).
- **FR-019**: System MUST NOT provide manual coupon creation or editing controls.

**Profile**
- **FR-020**: System MUST display editable fields for restaurant name, address, phone, email, and coupon discount values.
- **FR-021**: System MUST persist saved profile changes and show a success confirmation.
- **FR-022**: System MUST validate required fields (restaurant name, phone) before saving and show field-level validation errors.

**Public Intake Form**
- **FR-023**: System MUST serve an unauthenticated intake form at a per-restaurant URL (`/form/[slug]`).
- **FR-024**: The intake form MUST collect Name (required), Phone (required), Birthday (optional), and Favorite Dish (optional).
- **FR-025**: System MUST validate the phone number format before submission.
- **FR-026**: On valid submission, system MUST auto-generate a welcome coupon and trigger a WhatsApp message to the customer's phone with the coupon code.
- **FR-027**: System MUST display a success screen with the coupon code after successful submission.
- **FR-028**: System MUST deduplicate customers by phone number — submitting an existing phone number does not create a duplicate customer but still shows the success screen.
- **FR-029**: System MUST show a "restaurant not found" message for invalid or deactivated slugs.
- **FR-030**: System MUST show a friendly message when the restaurant has insufficient credits for new submissions.

### Key Entities

- **Restaurant (Tenant)**: Identified by slug. Has name, address, phone, email, credit balance, coupon discount values. One-to-many with Customers and Coupons.
- **Customer**: Belongs to a Restaurant. Has name, phone (unique per restaurant), birthday (optional), favorite dish (optional), last visit date, visit count, created date. Receives Coupons.
- **Coupon**: Belongs to a Restaurant and optionally a Customer. Has code, type (welcome/birthday/winback), discount value, status (sent/failed/pending), sent date. Auto-generated by backend processes.
- **Owner (User)**: Authenticated via email/password. Belongs to one Restaurant. Has access to dashboard, customers, coupons, and profile pages.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An owner can complete sign-up and reach the dashboard in under 60 seconds.
- **SC-002**: Dashboard KPIs and activity feed load and become readable within 2 seconds on a 3G connection.
- **SC-003**: The dashboard layout is fully usable on a 375px-wide viewport with no horizontal scrolling required.
- **SC-004**: Intake form completion rate exceeds 60% (visitors who start the form and successfully submit).
- **SC-005**: A first-time owner can locate their customer list within 10 seconds of landing on the dashboard.
- **SC-006**: Customer table sorting and search respond within 1 second for lists of up to 500 customers.
- **SC-007**: Coupon filter by type updates the displayed list within 500ms.
- **SC-008**: Profile edits save and display a success confirmation within 2 seconds.
- **SC-009**: Intake form submission completes and shows the success screen within 3 seconds on a 3G connection.
- **SC-010**: 95% of intake form validation errors are caught client-side before submission.
- **SC-011**: All owner-facing pages pass WCAG 2.1 AA accessibility checks.
- **SC-012**: Zero backend changes required — all functionality delivered via frontend code only.

## Assumptions

- Backend (Supabase database, auth, cron jobs, WhatsApp API integration) is fully operational and requires no changes.
- Existing Supabase Row Level Security (RLS) policies correctly scope data per authenticated restaurant owner.
- WhatsApp message delivery is handled by the existing backend — the frontend only triggers the workflow by inserting the customer/coupon record.
- Coupon codes are generated server-side (backend/database trigger) — the frontend displays the generated code from the response.
- Password reset flow uses Supabase's built-in email reset mechanism — the frontend only calls the reset endpoint.
- Restaurant owners have smartphones with 375px minimum viewport width (iPhone SE / equivalent Android).
- Each restaurant has fewer than 500 customers for the MVP — pagination is not required.
- Coupon types are exactly three: welcome, birthday, winback. No other types exist in the current system.
- The intake form slug is unique per restaurant and matches the slug stored in the existing database.
- Low-credit threshold is 50 credits, consistent with existing backend alert logic.
- All data displayed (customers, coupons, KPIs) already exists in the Supabase database — the frontend reads from existing tables.
- There is no i18n requirement for MVP — the interface is in English only.
- No OAuth, no social login, no CAPTCHA for MVP.
