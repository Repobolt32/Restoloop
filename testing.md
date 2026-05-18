# 🧪 Restoloop Hyper-Detailed Master Testing Protocol

**Objective:** To provide an unambiguous, step-by-step programmable test harness for the AI agent. The agent must strictly execute each phase in order automatically, replacing guesswork with definitive action steps.

---

## Phase 0: Prerequisites & Environment Verification

**Step 0.1: Verify Dev Server Status**
- **Action:** Run a `fetch` or `curl -I` request to `http://localhost:3000`.
- **Expected Output:** HTTP 200 OK or HTTP 302 Redirect.
- **On Failure:** Stop testing immediately. Next.js server is down.

**Step 0.2: Fetch Active Tenant Context**
- **Action:** Execute a Supabase REST API query `GET /rest/v1/tenants?select=*&limit=1`.
- **Headers:** `apikey: {NEXT_PUBLIC_SUPABASE_URL}`, `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`.
- **Expected Output:** JSON array with at least 1 tenant object.
- **Extraction:** Commit `tenant.id` and `tenant.slug` into local execution memory for subsequent phases.

---

## Phase 1: Navigation & Routing Validation

**Step 1.1: Authentication Firewall (Negative Test)**
- **Action:** Issue `GET /home` via Node or cURL without cookies.
- **Expected Output:** HTTP redirect (307/302) pointing to `/auth` or `/auth/sign-in`.
- **Pass Criteria:** Secure routes correctly reject unauthenticated ingress.

**Step 1.2: Public Intake Portal (Positive Test)**
- **Action:** Issue `GET /form/{tenant.slug}`.
- **Expected Output:** HTTP 200 OK.
- **Pass Criteria:** The server dynamically renders the React form without SSR 500 error.

---

## Phase 2: The Golden Loop (Backend E2E Data Flow)

**Step 2.1: Lead Injection (The Consumer Action)**
- **Action:** Execute a `POST` request to `http://localhost:3000/api/leads`.
- **Headers:** `Content-Type: application/json`
- **Payload:** `{"tenantId": "{tenant.id}", "name": "Agent Automated Test", "phone": "+919999999999"}` *(Generate random 10-digit number mapping to +91)*
- **Expected Output:** HTTP 200 OK. JSON yielding `{ success: true }`.

**Step 2.2: Automated Coupon Generation Verification (Database Output)**
- **Action:** Wait exactly 1500 milliseconds. Execute Supabase REST query `GET /rest/v1/coupons?tenant_id=eq.{tenant.id}&order=created_at.desc&limit=1`.
- **Expected Output:** Returns JSON array of length 1.
- **Extraction:** Read `coupon.code` and ensure `coupon.discount_amount` aligns with tenant settings.

**Step 2.3: Secure Coupon Validation API Firewall**
- **Action:** Execute a `POST` request to `http://localhost:3000/api/coupons/validate`.
- **Payload:** `{"code": "{coupon.code}"}`
- **Rule:** Do NOT inject Supabase Auth headers.
- **Expected Output:** HTTP 401 Unauthorized.
- **Pass Criteria:** The server successfully enforces the RLS/Auth requirement preventing anonymous coupon skimming.

---

## Phase 3: Crash Testing & Data Anomaly Resolution

**Step 3.1: Malformed Payload Rejection (Zod Defense Check)**
- **Action:** Execute `POST http://localhost:3000/api/leads`.
- **Payload:** `{"tenantId": "{tenant.id}", "name": "X", "phone": "123"}`
- **Expected Output:** HTTP 400 Bad Request.
- **Pass Criteria:** Server returns structured validation errors detailing short name and invalid phone string. The Next.js router MUST NOT crash with a 500 Internal Server Error.

**Step 3.2: Database Constraint Handling (Idempotency Check)**
- **Action:** Execute `POST http://localhost:3000/api/leads` utilizing the *exact same phone number* successfully injected in Step 2.1.
- **Expected Output:** HTTP 400 Bad Request.
- **Pass Criteria:** Server intercepts the Supabase `23505` unique constraint violation and returns a graceful "You have already signed up" message, ensuring the UI flow does not break.

---

## Phase 4: Final Reporting via `report.md`

**Step 4.1: Report Generation**
- **Action:** Once Steps 0.1 through 3.2 are complete, aggregate the HTTP status codes, test anomalies, and raw payload responses.
- **Step 4.2:** Use `write_to_file` to output `report.md` in the project root directory.
- **Format:** Structured markdown detailing Phase 1 through 3 passing logic. Terminate task block upon successful write.

---

## Phase 5: UI Element & Clickable Navigator (Redirection) Testing
**Objective:** Map every physical button, link, and interactive terminal component inside the React UI. Define strict pass/fail rules for state transitions and route redirections.

### 5.1 The Mission Control Dashboard (`/home`)
| Element | Architecture | Redirection / Action | Expected Behavior | Pass/Fail Criteria |
|---------|-------------|----------------------|-------------------|-------------------|
| **Manual Add Card** | `<Link>` | `GET /home/restaurant-profile` | Navigates to configuration node. | **Pass:** URL updates to `/home/restaurant-profile` instantly via Next.js router. |
| **Form Terminal Card** | `<Link>` | `GET /home/restaurant-profile` | Navigates to configurations to extract intake slug. | **Pass:** Successful client-side redirect. |
| **Billing System Card** | `<Link>` | `GET /home/billing` | Launches POS Transaction Terminal. | **Pass:** UI renders POS without full page reload. |
| **Sync DB Button** | `<Link>` | `GET /home/restaurant-profile` | Navigates to profile sync overlay. | **Pass:** Target page mounts correctly. |

### 5.2 The Stitch Sidebar Navigation (`StitchSidebar.tsx`)
| Element | Architecture | Redirection / Action | Expected Behavior | Pass/Fail Criteria |
|---------|-------------|----------------------|-------------------|-------------------|
| **Core Nav Items** | `<Link>` | Iterator (`/home`, `/billing`, etc.) | Client routing to core pages. | **Pass:** Active route receives `bg-orange-500/10` highlight state. |
| **Logout Button** | `<button>` | `signOut.mutate()` | Clears Supabase auth JWT token. | **Pass:** User is forcefully redirected to `/auth/sign-in`. |

### 5.3 The POS Billing Terminal (`/home/billing`)
| Element | Architecture | Redirection / Action | Expected Behavior | Pass/Fail Criteria |
|---------|-------------|----------------------|-------------------|-------------------|
| **Add Entry (+)** | `<button>` | State Mutation (`setItems`) | Appends empty item row object. | **Pass:** Row count increments, inputs render. |
| **Remove Entry (x)** | `<button>` | State Mutation (`removeItem`) | Pops specific item from array. | **Pass:** Granular row deletion, subtotal auto-recalculates. |
| **Verify Coupon** | `<button>` | API Mock / State Check | Checks code == `WELCOME50`. | **Pass:** Applies 50% discount and turns input border emerald. |
| **GST Toggle** | `<button>` | State Mutation (`setIsTaxEnabled`) | Toggles tax multiplier array. | **Pass:** UI visually shifts toggle knob; Grand Total updates live. |
| **Confirm Bill** | `<button>` | Submit Interceptor | Finalizes transaction. | **Pass:** Success banner overlay drops from screen top. |

### 5.4 The Public Intake Portal (`/form/[slug]`)
| Element | Architecture | Redirection / Action | Expected Behavior | Pass/Fail Criteria |
|---------|-------------|----------------------|-------------------|-------------------|
| **Submit Lead** | `<form>` | `POST /api/leads` | Invokes `sendWhatsApp()` & DB insert. | **Pass:** Form button disables during flight, succeeds with green checkmark. |

---

## Phase 6: Multi-Tenant Zero-Trust Isolation Testing
**Objective:** Prove that the Row Level Security (RLS) policies and database architecture strictly partition data across multiple massive concurrent users without bleeding.

**Step 6.1: Bulk Tenant Generation**
- **Action:** Using Supabase MCP or API, inject 5 entirely distinct mock businesses into the `tenants` table (Tenant Alpha, Beta, Charlie, Delta, Echo).

**Step 6.2: Concurrent Lead Injection**
- **Action:** Execute the `/api/leads` payload 5 times. Each payload MUST use a different `tenant_id` mapping to the 5 generated tenants, and distinct phone numbers.
- **Expected Output:** All 5 webhook injections return `HTTP 200 OK`.

**Step 6.3: Cross-Contamination Skimming Evaluation**
- **Action:** Access the database using an authenticated Supabase user token that strictly belongs to **Tenant Alpha**.
- **Execution:** Query `SELECT * FROM coupons;` masking as Tenant Alpha.
- **Pass Criteria:** The API MUST return exactly 1 coupon (belonging to Alpha). The other 4 coupons generated in Step 6.2 MUST be aggressively hidden by the Postgres RLS firewall.

**Step 6.4: Database Purge**
- **Action:** Upon successful extraction, hard-delete the 5 synthetic tenants and their cascaded data to preserve production integrity.