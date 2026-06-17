# Graph Report - .  (2026-06-16)

## Corpus Check
- Corpus is ~24,861 words - fits in a single context window. You may not need a graph.

## Summary
- 187 nodes · 188 edges · 61 communities (49 shown, 12 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication Flow|Authentication Flow]]
- [[_COMMUNITY_Dashboard & Home|Dashboard & Home]]
- [[_COMMUNITY_Admin & Forms|Admin & Forms]]
- [[_COMMUNITY_Campaigns & WhatsApp|Campaigns & WhatsApp]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Restaurant Profile|Restaurant Profile]]
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Admin Layout|Admin Layout]]
- [[_COMMUNITY_Password Reset|Password Reset]]
- [[_COMMUNITY_Update Password|Update Password]]
- [[_COMMUNITY_Safari Favicon|Safari Favicon]]
- [[_COMMUNITY_Android Chrome 192|Android Chrome 192]]
- [[_COMMUNITY_Android Chrome 512|Android Chrome 512]]
- [[_COMMUNITY_Apple Touch Icon|Apple Touch Icon]]
- [[_COMMUNITY_Favicon 16x16|Favicon 16x16]]
- [[_COMMUNITY_Favicon 32x32|Favicon 32x32]]
- [[_COMMUNITY_Microsoft Tile|Microsoft Tile]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 17 edges
2. `getTenantForUser()` - 13 edges
3. `createServiceClient()` - 12 edges
4. `processCampaigns()` - 6 edges
5. `Restoloop` - 6 edges
6. `middleware()` - 5 edges
7. `generateUniqueSlug()` - 5 edges
8. `Restoloop Tech Stack` - 5 edges
9. `addCredits()` - 4 edges
10. `updateRestaurantProfile()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AdminDashboardPage()` --calls--> `createServiceClient()`  [INFERRED]
  app/admin/page.tsx → lib/supabase/server.ts
- `POST()` --calls--> `getTenantForUser()`  [INFERRED]
  app/api/coupons/validate/route.ts → lib/tenant.ts
- `GET()` --calls--> `processCampaigns()`  [INFERRED]
  app/api/cron/process-campaigns/route.ts → lib/campaigns.ts
- `POST()` --calls--> `createServiceClient()`  [INFERRED]
  app/api/leads/route.ts → lib/supabase/server.ts
- `generateMetadata()` --calls--> `createServiceClient()`  [INFERRED]
  app/form/[slug]/page.tsx → lib/supabase/server.ts

## Hyperedges (group relationships)
- **Supabase Email Authentication Templates** — restoloop_supabase, supabase_template_change_email, supabase_template_confirm_email [EXTRACTED 1.00]

## Communities (61 total, 12 thin omitted)

### Community 0 - "Authentication Flow"
Cohesion: 0.12
Nodes (3): signIn(), signUp(), createClient()

### Community 1 - "Dashboard & Home"
Cohesion: 0.14
Nodes (5): CouponsPage(), DashboardPage(), getTenantForUser(), RestaurantProfilePage(), POST()

### Community 2 - "Admin & Forms"
Cohesion: 0.19
Nodes (8): AdminDashboardPage(), handleUpdateCredits(), POST(), addCredits(), NotFound(), CustomerFormPage(), generateMetadata(), createServiceClient()

### Community 3 - "Campaigns & WhatsApp"
Cohesion: 0.26
Nodes (10): processCampaigns(), sendCampaign(), generateCouponCode(), generateExpiryDate(), sendBirthdayMessage(), sendMetaMessage(), sendThirdPartyMessage(), sendWelcomeMessage() (+2 more)

### Community 4 - "Project Overview"
Cohesion: 0.17
Nodes (13): Restoloop, Billing Terminal, Coupon Engine, Guest Analytics, Next.js 15, Playwright E2E Tests, Restoloop Project Structure, QR-Based Intake (+5 more)

### Community 5 - "Restaurant Profile"
Cohesion: 0.27
Nodes (5): updateRestaurantProfile(), generateUniqueSlug(), toShortSlug(), toSlug(), toSlugWithSuffix()

### Community 7 - "Middleware"
Cohesion: 0.46
Nodes (6): getPatterns(), isServerAction(), matchUrlPattern(), middleware(), setRequestId(), withCsrfMiddleware()

## Knowledge Gaps
- **14 isolated node(s):** `Next.js 15`, `TailwindCSS v4 + Shadcn UI`, `Playwright E2E Tests`, `Restoloop Project Structure`, `QR-Based Intake` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Authentication Flow` to `Admin Layout`, `Password Reset`, `Restaurant Profile`, `Dashboard & Home`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `createServiceClient()` connect `Admin & Forms` to `Authentication Flow`, `Campaigns & WhatsApp`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `getTenantForUser()` connect `Dashboard & Home` to `Restaurant Profile`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `getTenantForUser()` (e.g. with `POST()` and `CouponsPage()`) actually correct?**
  _`getTenantForUser()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `createServiceClient()` (e.g. with `AdminDashboardPage()` and `addCredits()`) actually correct?**
  _`createServiceClient()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `processCampaigns()` (e.g. with `GET()` and `createServiceClient()`) actually correct?**
  _`processCampaigns()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Next.js 15`, `TailwindCSS v4 + Shadcn UI`, `Playwright E2E Tests` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._