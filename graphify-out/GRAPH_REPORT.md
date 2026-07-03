# Graph Report - .  (2026-07-02)

## Corpus Check
- 148 files · ~107,516 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 218 edges · 39 communities (36 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 18 edges
2. `createClient()` - 16 edges
3. `createWhatsAppAdapter()` - 9 edges
4. `OpenWAAdapter` - 9 edges
5. `runBirthdayCampaigns()` - 7 edges
6. `runWinbackCampaigns()` - 7 edges
7. `MetaAdapter` - 7 edges
8. `maskPhone()` - 6 edges
9. `runWelcomeReminders()` - 6 edges
10. `GET()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `IntakeFormPage()` --calls--> `createServiceClient()`  [INFERRED]
  src/app/form/[slug]/page.tsx → src/lib/supabase/server.ts
- `addCreditsAction()` --calls--> `createServiceClient()`  [INFERRED]
  src/app/admin/[id]/actions.ts → src/lib/supabase/server.ts
- `POST()` --calls--> `createServiceClient()`  [INFERRED]
  src/app/api/razorpay/webhook/route.ts → src/lib/supabase/server.ts
- `POST()` --calls--> `createWhatsAppAdapter()`  [INFERRED]
  src/app/api/whatsapp/route.ts → src/lib/whatsapp/adapter.ts
- `POST()` --calls--> `createServiceClient()`  [INFERRED]
  src/app/api/whatsapp/route.ts → src/lib/supabase/server.ts

## Communities (39 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (4): GET(), addCreditsAction(), maskPhone(), createClient()

### Community 2 - "Community 2"
Cohesion: 0.35
Nodes (11): generateCampaignCouponCode(), runBirthdayCampaigns(), runExpiryReminders(), runWelcomeReminders(), runWinbackCampaigns(), chain(), tableHandler(), createServiceClient() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (3): updateCampaignSettings(), updateDiscountsAction(), createClient()

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (4): createCouponAction(), deleteCouponAction(), disableCouponAction(), generateCode()

### Community 5 - "Community 5"
Cohesion: 0.32
Nodes (3): POST(), chain(), tableHandler()

### Community 6 - "Community 6"
Cohesion: 0.32
Nodes (4): submitIntakeForm(), loadModule(), handleSubmit(), IntakeFormPage()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `Community 2` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 0` to `Community 8`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createServiceClient()` (e.g. with `addCreditsAction()` and `POST()`) actually correct?**
  _`createServiceClient()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `createWhatsAppAdapter()` (e.g. with `POST()` and `runWelcomeReminders()`) actually correct?**
  _`createWhatsAppAdapter()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `runBirthdayCampaigns()` (e.g. with `GET()` and `createServiceClient()`) actually correct?**
  _`runBirthdayCampaigns()` has 3 INFERRED edges - model-reasoned connections that need verification._