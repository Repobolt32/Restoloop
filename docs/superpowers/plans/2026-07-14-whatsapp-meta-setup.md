# WhatsApp Meta Platform Setup & Configuration Plan

**Goal:** Set up, configure, and verify the official Meta WhatsApp Cloud API integration for automated campaigns and inbound webhook messaging.

**Architecture:** Use the existing `MetaAdapter` in `src/lib/whatsapp/meta.ts` and update the automated campaigns in `src/lib/campaigns/index.ts` to dynamically use `sendTemplate` when `WHATSAPP_PROVIDER === 'meta'` to comply with Meta's 24-hour message window policy.

**Tech Stack:** Next.js (App Router), Supabase (Postgres & Auth), Meta Graph API, Vitest.

## Required Skills
- `typescript-best-practices`
- `route-handlers`
- `ponytail` (lite/minimal/YAGNI)
- `test-driven-development`

## Global Constraints
- **Money:** All monetary amounts must be stored as integers in `cents` (no floats).
- **Phone:** Numbers must be normalized and stored in E.164 format `919876543210` (no `+` prefix).
- **Theme:** Follow the Crimson & Warm Saffron light mode theme from `design-system/restoloop/MASTER.md`. No dark mode.
- **TDD:** No production code changes without writing a failing test first.

---

## Part 1: Meta App and Webhook Configuration (User Action Required)

To connect Restoloop to the official Meta platform, the following credentials and configurations must be obtained from the Meta Developer Dashboard:

### 1. Meta Developer App Registration
1. Go to [Meta Developers Portal](https://developers.facebook.com/) and register as a developer.
2. Create a new App of type **Business**.
3. In the App Dashboard, add the **WhatsApp** product.
4. Navigate to **WhatsApp > API Setup** to find:
   - **Phone Number ID**: Used to specify the sending number.
   - **WhatsApp Business Account ID**: Used for WABA settings.
5. Generate a **Permanent System User Access Token** in your Meta Business Manager:
   - Go to Business Settings > Users > System Users.
   - Create or select a System User and click **Generate New Token**.
   - Select your App and check the `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
   - Copy the generated token.

### 2. Environment Variables Configuration
1. Add the following credentials to your local `.env.local` and production Vercel environments:
   ```env
   WHATSAPP_PROVIDER=meta
   META_PHONE_NUMBER_ID=<your-meta-phone-number-id>
   META_ACCESS_TOKEN=<your-meta-system-user-token>
   META_APP_SECRET=<your-meta-app-secret>
   META_VERIFY_TOKEN=<a-random-secure-string-for-webhook-handshake>
   ```

### 3. Registering Campaigns Templates in Meta Business Suite
Because Meta blocks free-text (`sendText`) messages sent outside the 24-hour window from the user's last inbound message, you must register 4 templates in the [Meta WhatsApp Manager](https://business.facebook.com/wa/manage/templates/) under Account Tools > Message Templates:

#### Template A: `welcome_reminder`
- **Category:** Utility
- **Language:** English (`en`)
- **Body Text:** `Hi {{1}}! Reminder: your coupon {{2}} for {{3}} is waiting for you! Reply STOP to opt out.`
- **Parameters:** `{{1}}` (Name), `{{2}}` (Coupon Code), `{{3}}` (Restaurant Name)

#### Template B: `birthday_campaign`
- **Category:** Marketing
- **Language:** English (`en`)
- **Body Text:** `Happy Birthday {{1}}! Celebrate with {{2}}% OFF at {{3}}. Code: {{4}}. Reply STOP to opt out.`
- **Parameters:** `{{1}}` (Name), `{{2}}` (Discount Percent), `{{3}}` (Restaurant Name), `{{4}}` (Coupon Code)

#### Template C: `winback_campaign`
- **Category:** Marketing
- **Language:** English (`en`)
- **Body Text:** `We miss you {{1}}! Enjoy {{2}}% OFF at {{3}}. Code: {{4}}. Reply STOP to opt out.`
- **Parameters:** `{{1}}` (Name), `{{2}}` (Discount Percent), `{{3}}` (Restaurant Name), `{{4}}` (Coupon Code)

#### Template D: `expiry_reminder`
- **Category:** Utility
- **Language:** English (`en`)
- **Body Text:** `Hey {{1}}! Don't miss out — your coupon {{2}} at {{3}} expires in {{4}} day(s). Reply STOP to opt out.`
- **Parameters:** `{{1}}` (Name), `{{2}}` (Coupon Code), `{{3}}` (Restaurant Name), `{{4}}` (Days Left)

### 4. Configure Webhooks
1. In the Meta App Settings, go to **WhatsApp > Configuration**.
2. Click **Edit** next to Webhook.
3. Set **Callback URL** to: `https://<your-domain>/api/whatsapp` (use an ngrok public URL for local testing).
4. Set **Verify Token** to: the value of `META_VERIFY_TOKEN` configured in your env.
5. Click **Verify and Save** (the GET endpoint in `/api/whatsapp` verifies this challenge).
6. Click **Manage** under Webhook Fields and subscribe to the `messages` event.

---

## Part 2: Code Integration Tasks (Developer Actions)

### Task 1: Update Campaigns to Support Template Sends on Meta Mode

**Files:**
- Modify: `src/lib/campaigns/index.ts`
- Test: `src/lib/campaigns/index.test.ts`

- **Step 1: Write failing tests in `src/lib/campaigns/index.test.ts`**
- **Step 2: Run test to verify it fails**
- **Step 3: Update `src/lib/campaigns/index.ts` to implement dynamic routing**
- **Step 4: Run test to verify it passes**
- **Step 5: Commit changes**

---

## Verification Plan

### Automated Tests
- Run all unit tests to verify type safety and logic correctness:
  ```bash
  pnpm typecheck
  pnpm lint
  pnpm test
  ```

### Manual Verification
1. Setup a public ngrok tunnel:
   ```bash
   ngrok http 3000
   ```
2. Set webhook callback in the Meta Developer Console to:
   `https://<your-ngrok-subdomain>.ngrok-free.dev/api/whatsapp`
3. Scan / Tap the wa.me link generated by submitting the Intake form `/form/[slug]`.
4. Send an inbound message (`YES` or any phrase) from your test WhatsApp number.
5. Verify in your terminal console logs that the webhook is successfully hit and writes message logs to Supabase:
   ```
   [META-WEBHOOK] event: {"from":"91xxxxxxxxxx","to":"91xxxxxxxxxx","body":"YES","msgId":"wamid..."}
   ```
6. Verify you receive the opt-in prompt / welcome coupon as a reply on your WhatsApp device.
