# WhatsApp Meta Campaign Templates & Variations

This file contains the Meta Template configurations and copywriting variations for all customer retention campaigns in Restoloop.

## Global Button Configurations
All interactive templates use the exact same two Quick Reply buttons:
- Button 1: **`Accept Offer`**
- Button 2: **`Cancel Offer`**

*Note: For compliance and spam protection, a text-based opt-out instruction (`Reply STOP to opt out`) is included at the end of the body text.*

---

## 1. Welcome Coupon (`welcome_coupon`)
* **When Sent:** Immediately after a new user scans the QR code/submits the form and replies `YES` to opt in.
* **API Method:** `sendText` (sent inside the 24-hour customer window).
* **Variables:**
  - `{{1}}` = Restaurant Name
  - `{{2}}` = Coupon Code (e.g. `W10-XXXXXX`)
  - `{{3}}` = Discount Percent (e.g. `10`)
  - `{{4}}` = Expiry Date (DD/MM)

### Variations:
*   **Variation 1 (Friendly & Clear):**
    > "Awesome! Here is your exclusive deal for {{1}}: Code {{2}} gets you {{3}}% OFF on your next visit! Expires on {{4}}. Reply STOP to opt out."
*   **Variation 2 (Club Welcome):**
    > "Great! Thank you for joining {{1}}'s loyalty club. Enjoy {{3}}% OFF your bill with code {{2}}. Valid until {{4}}. Reply STOP to opt out."
*   **Variation 3 (Direct & Action-focused):**
    > "Welcome! Your exclusive offer for {{1}} is active. Use code {{2}} by {{4}} to get {{3}}% OFF your order! Reply STOP to opt out."

---

## 2. Welcome Reminder (`welcome_reminder`)
* **When Sent:** Automated cron campaign sent **5 days before** the welcome coupon expires (16 days after signup).
* **API Method:** `sendTemplate` (Meta approved template).
* **Variables:**
  - `{{1}}` = Customer Name
  - `{{2}}` = Coupon Code
  - `{{3}}` = Restaurant Name
  - `{{4}}` = Expiry Date (DD/MM)

### Variations:
*   **Variation 1 (Friendly Check-in - RECOMMENDED):**
    > "Hi {{1}}! Just a reminder: your joining treat code {{2}} at {{3}} is expiring soon. Use it by {{4}} to get your discount! Reply STOP to opt out."
*   **Variation 2 (Scarcity-focused):**
    > "Hey {{1}}! Don't let your coupon {{2}} go to waste. Get your discount at {{3}} before it expires on {{4}}! Reply STOP to opt out."
*   **Variation 3 (Direct Invitation):**
    > "Hello {{1}}! We'd love to see you at {{3}}. Your special offer code {{2}} is valid until {{4}}. Are you visiting us soon? Reply STOP to opt out."

---

## 3. Birthday Campaign (`birthday_campaign`)
* **When Sent:** Automated cron campaign sent **2 days before** the customer's birthday.
* **API Method:** `sendTemplate` (Meta approved template).
* **Variables:**
  - `{{1}}` = Customer Name
  - `{{2}}` = Discount Percent
  - `{{3}}` = Restaurant Name
  - `{{4}}` = Coupon Code
  - `{{5}}` = Expiry Date (DD/MM)

### Variations:
*   **Variation 1 (Advance Treat - RECOMMENDED):**
    > "Happy Birthday in advance, {{1}}! 🎂 We have a special invite ready for you. Enjoy {{2}}% OFF at {{3}} using code {{4}}. Valid until {{5}}. Reply STOP to opt out."
*   **Variation 2 (Festive Celebration):**
    > "Your birthday is coming up, {{1}}! 🎉 Celebrate early with {{2}}% OFF at {{3}}. Show code {{4}} on your visit by {{5}} to redeem. Reply STOP to opt out."
*   **Variation 3 (Early Birthday Gift):**
    > "Hey {{1}}! We want to treat you for your birthday! Enjoy {{2}}% OFF at us, {{3}}, with code {{4}}. Expires on {{5}}. Reply STOP to opt out."

---

## 4. Winback Campaign (`winback_campaign`)
* **When Sent:** Automated cron campaign sent **40 days** after the customer's last visit.
* **API Method:** `sendTemplate` (Meta approved template).
* **Variables:**
  - `{{1}}` = Customer Name
  - `{{2}}` = Discount Percent
  - `{{3}}` = Restaurant Name
  - `{{4}}` = Coupon Code
  - `{{5}}` = Expiry Date (DD/MM)

### Variations:
*   **Variation 1 (We Miss You - RECOMMENDED):**
    > "We miss you, {{1}}! It's been a while since your last visit to {{3}}. Come back and get {{2}}% OFF with code {{4}}. Offer valid until {{5}}. Reply STOP to opt out."
*   **Variation 2 (Warm Check-in):**
    > "Hey {{1}}! We'd love to see you again at {{3}}. Here is a special {{2}}% discount (Code: {{4}}) for your next visit. Expires on {{5}}. Reply STOP to opt out."
*   **Variation 3 (Welcome Back Treat):**
    > "Hello {{1}}! We've missed serving you at {{3}}. Grab {{2}}% OFF on us using code {{4}} by {{5}}. Reply STOP to opt out."

---

## 5. Expiry Reminder (`expiry_reminder`)
* **When Sent:** Automated cron campaign sent **3 days before** the winback coupon expires.
* **API Method:** `sendTemplate` (Meta approved template).
* **Variables:**
  - `{{1}}` = Customer Name
  - `{{2}}` = Coupon Code
  - `{{3}}` = Restaurant Name
  - `{{4}}` = Days Remaining
  - `{{5}}` = Expiry Date (DD/MM)

### Variations:
*   **Variation 1 (Urgency Warning - RECOMMENDED):**
    > "Hi {{1}}! Your special coupon {{2}} for {{3}} is expiring in {{4}} days on {{5}}. Don't let your discount go to waste! Reply STOP to opt out."
*   **Variation 2 (Helpful Heads-up):**
    > "Hey {{1}}! Just a heads-up that your code {{2}} at {{3}} is valid for only {{4}} more days (expires {{5}}). Hope to see you! Reply STOP to opt out."
*   **Variation 3 (Scarcity Alert):**
    > "Hello {{1}}! Quick reminder: use code {{2}} to get your discount at {{3}} before it expires on {{5}} ({{4}} days left). Reply STOP to opt out."
