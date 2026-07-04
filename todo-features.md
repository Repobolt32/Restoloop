# Checklist: 21-Day Unlimited Trial (₹599) & Onboarding Flow

This file lists the checklist for implementing the low-friction account-first trial activation, payment integration, dashboard widgets, and administrative fallback tools.

---

## 0. Account-First Flow (Onboarding Foundation)
* [ ] **Fast Signup:** Allow restaurant owners to register quickly using their email, password, and restaurant name, then log them in and redirect them directly to the main dashboard.
* [ ] **Exploratory Access:** Allow new users to view all dashboard sections (like guests, coupons, campaigns, and settings) without paying upfront, but lock live features (like downloading the table QR code) until they activate their trial.
* [ ] **Restaurant Default State:** New restaurant accounts are initialized on the free plan with 0 credits and have not yet used their trial.

---

## 1. Premium Membership Banner (Dashboard Invite)
* [ ] **Promotional Banner:** Add a visual banner at the top of the dashboard page with a crimson-to-saffron gradient.
  * **Not Started Trial:** Displays a message to claim the 21-Day Unlimited Growth Trial for ₹599.
  * **Active Trial:** Displays a countdown showing how many days are left on the trial and confirms that campaign messaging is running.
  * **Expired Trial:** Shows a warning that the trial has ended and prompts the owner to choose a subscription plan.
* [ ] **Locked Feature Overlay:** Apply a blurred lock overlay on features like the table QR code download card when the restaurant is on the free plan or their trial has expired.

---

## 2. Payment Integration Layer
* [ ] **Secure Payments:** Integrate the ₹599 trial activation using the platform's payment provider.
* [ ] **Trial Limit Enforcement:** Ensure that a restaurant can only buy/use this 21-day unlimited trial once to prevent abuse.
* [ ] **Trial Status Update:** When the payment is successful, automatically activate the 21-day unlimited trial for that restaurant.
* [ ] **Local Simulator Support:** Support a mock testing environment to simulate payments locally during development.

---

## 3. Credit & Trial Progress Indicator
* [ ] **Header Widget:** Add a progress dial in the top-right corner of the dashboard header.
* [ ] **Trial Indicator:** If the trial is active, display the number of days left in the trial (e.g., "21d").
* [ ] **Credit Indicator:** If the trial is not active, display the number of remaining credits.
* [ ] **Low Credit Warnings:** If credits drop below 200, turn the indicator red/orange and display a "please top up" warning.
* [ ] **Settings Shortcut:** Make the widget clickable so that clicking it redirects the owner to the Settings page.

---

## 4. Super-Admin Fallback & Support Controls
* [ ] **Plan & Trial Override:** Provide controls on the restaurant detail admin page to manually change any restaurant's plan status (Free, Trial, Starter, Pro) and set custom trial expiry dates.
* [ ] **Account Suspension:** Add a status switch to suspend/deactivate a restaurant. When suspended, block their public intake form and skip sending their campaigns in the daily messaging queue.
* [ ] **Support Impersonation ("Login-As"):** Implement a button in the admin portal to securely log into any restaurant owner's dashboard to troubleshoot setup issues.
* [ ] **Manual Cron Trigger:** Add a button in the admin portal to manually force-run the daily automated campaign checks for a single restaurant immediately.
* [ ] **WhatsApp Session Reset:** Provide a button to clear and reset a restaurant's WhatsApp provider connection details if they get stuck.
* [ ] **Global Coupon Finder:** Add a search field in the admin panel to look up any coupon code globally and manually force-redeem or reactivate it to resolve customer support issues.
