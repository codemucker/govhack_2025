# LegalEase — System Spec & Starter (TypeScript + Vue + Encore.dev)

A hand-off blueprint for an AI agent to implement a tool that helps users navigate Australian regulatory requirements across **local councils**, **states/territories**, and the **Commonwealth**. The tool **triages a plain-English request**, determines **jurisdiction & legal area**, **routes** to a specialist reasoning profile, and returns a **step-by-step plan** with **direct links** to the responsible agencies/services.

> **Disclaimer**: This tool surfaces public information and automates discovery. It is **not legal advice**. Always provide clear disclosures, provenance links, dates last-checked, and encourage users to verify with the responsible authority or a qualified professional.

---

## Product Goals

1. **Triage → Understand the task** in user terms (e.g., “build a boundary fence”, “open a café”, “run a festival”, “hire overseas staff”).
2. **Locate the user** (address or council, state/territory, and whether special planning overlays apply—e.g., heritage, flood, bushfire-prone, coastal, biosecurity).
3. **Identify legal area(s)**: planning/building, licensing, business formation, tax, environmental, workplace/OHS, public health, road/traffic, consumer law, charity/NFP, import/export, etc.
4. **Determine applicable jurisdiction(s)** and potential **conflicts/overlaps** (Commonwealth vs state vs local instruments; industry regulators).
5. **Route** to specialised prompts/models/tooling for each domain.
6. **Return** a structured response (JSON + human-readable) with **actions, forms, checklists, fees if published, contacts, and live links**. Include **confidence** and **assumptions**, and ask for missing facts.
7. **Sell API access** via a Vue.js SPA; allow a **free demo** with throttling.

---

## High-Level Architecture

```
users (web) ──> Vue.js SPA ──API──> Encore.dev API Gateway (TypeScript)
                                         │
                                         ├─ Triage Service — NLU + entity extraction
                                         ├─ Jurisdiction Resolver — geo/council/state
                                         ├─ Legal Domain Router — prompt routing, tool selection
                                         ├─ Knowledge Graph / Registry — authorities, instruments, endpoints
                                         ├─ Evidence Collector — link discovery + caching
                                         ├─ Composer — action plan + citations + JSON
                                         └─ Rate limiting / analytics / audit log
```

### Services & Modules (TypeScript with Encore.dev)

- `/services/api` API gateway service
- `/services/triage` intent/slot extraction (task, location, activity type, industry)
- `/services/jurisdiction` jurisdiction resolver (council ↔ state ↔ commonwealth), overlays
- `/services/router` domain routing & specialist prompt selection
- `/services/sources` adapters to public registries/APIs
- `/services/compose` answer assembly, checklists, forms, links, confidence
- `/services/store` persistence (Redis/PostgreSQL) for caching metadata & rate limits
- `/services/policy` conflict-flagger & precedence notes (rule-of-thumb with caveats)

---

## Data Sources (adapters)

> Implement as pluggable providers with rate limits and caching. Avoid scraping where official APIs exist. Persist **URL**, **title**, **publisher**, **jurisdiction**, **last-checked**, **hash**, **license**.

- **Commonwealth**: Federal Register of Legislation; business.gov.au; ABR/ABN Lookup; ATO (tax); ASIC (companies & BN); TGA (therapeutic), DAFF/biosecurity, ACNC (charities), Fair Work Ombudsman/Commission, OAIC (privacy), CASA (aviation), APRA (prudential), AUSTRAC (AML/CTF), IP Australia.
- **States/Territories** (examples):
  - **NSW**: NSW Legislation, NSW Planning Portal, Service NSW licences.
  - **VIC**: Victorian Legislation, VicPlan/Planning Schemes Online, Service VIC.
  - **QLD**: QLD Legislation, **ABLIS** (key for licences), Development.i; Business Queensland.
  - **WA/SA/TAS/ACT/NT**: respective legislation portals & licence directories.
- **Local**: Councils’ planning/building guidelines, local laws, permit pages, waste/trade waste, food business approvals, event permits, signage.
- **Spatial overlays** (optional): PSMA/G-NAF for addressing, state spatial hubs for flood/heritage/bushfire overlays.

> Start with **ABLIS** for a wide coverage of licences/permits; then add state portals. Store canonical links rather than scraped text. All answers should cite **source URLs** and retrieval dates.

---

## JSON Contract (Response)

```json
{
  "query": {
    "raw": "Build a new boundary fence at 12 Sample St, Brisbane",
    "normalized": "build boundary fence",
    "location": { "address": "12 Sample St, Brisbane QLD", "council": "Brisbane City Council", "state": "QLD", "postcode": "4000", "geo": { "lat": 0, "lng": 0 } },
    "assumptions": ["residential property", "not heritage listed"]
  },
  "domains": ["planning", "building"],
  "jurisdictions": [
    { "level": "local", "name": "Brisbane City Council", "confidence": 0.95 },
    { "level": "state", "name": "Queensland", "confidence": 0.9 },
    { "level": "commonwealth", "name": "Australia", "confidence": 0.6 }
  ],
  "requirements": [
    {
      "title": "Fencing rules and approvals",
      "jurisdiction": "local",
      "authority": "Brisbane City Council",
      "actions": [
        { "step": 1, "desc": "Check fence height and boundary setback standards", "link": "https://...", "evidence_id": "src_123" },
        { "step": 2, "desc": "If over X m, lodge development application", "link": "https://...", "form": "PDF|online" }
      ],
      "notes": ["Neighbour consent may be required"],
      "confidence": 0.8
    }
  ],
  "conflicts": [
    {
      "description": "State code permits up to 2.1m, local by-law suggests 1.8m; higher control applies if state code overrides local in this context.",
      "severity": "medium",
      "links": ["src_201", "src_333"],
      "disclaimer": "Verify with authority."
    }
  ],
  "contacts": [{ "authority": "Brisbane City Council", "type": "planning", "phone": "...", "url": "https://..." }],
  "citations": [{ "id": "src_123", "title": "Local Law ...", "url": "https://...", "last_checked": "2025-08-29" }],
  "disclaimer": "Information only; not legal advice.",
  "version": "v1"
}
```

---

## Triage Flow (NLU)

1. **Capture**: free-text + optional structured fields (address, business activity, industry ANZSIC code if known, timeline).
2. **Extract**:
   - **Intent**: e.g., "build fence", "open café", "run event", "hire employees", "import goods".
   - **Entities**: address, property type, business type, alcohol/food/music/live animals, number of attendees, etc.
3. **Clarify** (adaptive): ask only for missing, high-impact details (e.g., exact address, venue capacity, food handling, alcohol service, construction height).
4. **Resolve Location**: to council/state; flag overlays if available.
5. **Domain Classifier**: multi-label (planning, health, environment, business-setup, workplace, consumer, tax, IP, charity, transport, communications, education, childcare, aged care, etc.).
6. **Route**: choose specialist profile(s) (see below).

---

## Specialist Profiles (Prompt Routing)

Each profile has: **system guidelines**, **required facts**, **linking policy**, **risk language**, and **output schema**. Examples:

- **Planning/Building**: development approvals, building codes, zoning, overlays, public land/road reserve use.
- **Business Licences**: food, alcohol, beauty/cosmetic, trades, professional registrations, signage, outdoor dining.
- **Employment/OHS**: minimum standards, awards references (surface only), WHS regulator links.
- **Environment**: waste, noise, emissions, heritage, protected areas.
- **Events/Permits**: temporary road closures, security plans, public liability, noise curfews.
- **Health (Public)**: food safety programs, notifications, inspections.
- **Financial/Tax**: ABN, GST registration, payroll basics, links to ATO.
- **Corporate/Charity**: ASIC company registration, business names, ACNC if NFP.

> Profiles **must avoid legal advice** and always include **citations** + **contacts**.

---

## Conflict & Jurisdiction Heuristics (Non-binding)

- **Show all possibly applicable controls** (Commonwealth, state/territory, local) and explain typical **precedence patterns** (where an Act overrides a subordinate instrument, etc.), flagging uncertainty.
- Provide **side-by-side** requirements when local by-laws are stricter than state baselines.
- Mark conflicts with **severity** and prompt the user to confirm facts (e.g., heritage listing) that can resolve ambiguity.

> The system should **never assert precedence as a legal determination**; instead, cite the sources and advise verifying with the authority.

---

## Backend (TypeScript/Encore.dev) — Modules & Skeleton

```
/legalease
  /services/api/index.ts (API gateway)
  /services/triage/index.ts (intent/entities, clarifying Qs)
  /services/jurisdiction/index.ts (geo lookup, council/state mapping)
  /services/router/index.ts (profile selection)
  /services/sources/index.ts (providers to registries/APIs)
  /services/compose/index.ts (plan builder, JSON formatter)
  /services/conflict/index.ts (comparators, notes)
  /services/store/index.ts (redis/pg cache, client plans)
  /frontend (Vue.js SPA)
    /src/components
    /src/views
    /src/services
    /src/store
```

### Encore.dev API Endpoints

- `POST /v1/triage/:clientId` → accepts `{query, address?, lat?, lng?}`; returns structured plan JSON.
- `GET  /v1/links/:jurisdiction/:domain` → curated registry of official links.
- `GET  /v1/councils/search` → fuzzy council search with query param (for client-side UI helpers).

### Security

- **Static-site-friendly**: public **client_id** + **Origin allowlist** + per-client rate limit.
- Optional server-side **secret** for partners.
- **PII minimisation**: redact or hash precise address in logs; store only geo hash or council ID when possible.

### CORS & Rate Limit

- Mirror the approach from the Transliteration API sample (Origin-bound allowlists + token bucket per client).

---

## Knowledge Graph / Registry Schema

**Tables (PostgreSQL):**

- `authorities`: id, name, level (`local|state|commonwealth`), state_code, council_id, contact_phone, contact_url.
- `instruments`: id, title, type (`Act|Regulation|Local Law|Policy|Guideline`), jurisdiction_ref, url, last_checked, publisher.
- `licences`: id, name, domain, authority_ref, url, form_type, fee_hint, notes.
- `overlays`: id, type (`heritage|flood|bushfire|coastal`), source_url, geojson.
- `links_index`: keyword, instrument_ref (for fast lookup).

**Caches**: `source_hash` to quickly detect changes.

---

## Domain Routing Logic (TypeScript)

```typescript
const intent = await triage.extract(userText);
const place = await jurisdiction.resolve(entities.address || entities.latlng);
const labels = await router.classify(intent, entities);
const profiles = await router.select(labels);
const results = [];

for (const profile of profiles) {
  const missingFacts = profile.requiredFacts.filter(f => !entities[f]);
  if (missingFacts.length > 0) {
    questions.push(...profile.clarifyingQuestions(missingFacts));
  }
  const answers = await profile.querySources(place, entities);
  results.push(await profile.compose(place, entities, answers));
}

const plan = await compose.merge(results);
const conflicts = await conflict.compare(plan.requirements);
return compose.toJSON(plan, conflicts, citations);
```

---

## Vue.js Frontend (SPA)

- **Landing page**: explain the tool, disclaimers, pricing.
- **Try it now** interactive component → calls `POST /v1/triage/demo-public`.
- **Results view**: shows **checklist**, **links**, **contacts**, and a **copyable JSON**.
- **CTA**: "Talk to Council/Authority" buttons (link-out), and "Get API Access".

### Vue Component Example

```vue
<template>
  <div class="legalease-navigator">
    <div class="search-form">
      <input 
        v-model="query" 
        placeholder="What do you want to do?" 
        @keyup.enter="checkRequirements"
      />
      <input 
        v-model="address" 
        placeholder="Address (optional)" 
      />
      <button @click="checkRequirements" :disabled="loading">
        {{ loading ? 'Checking...' : 'Check Requirements' }}
      </button>
    </div>
    <results-view v-if="results" :data="results" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/api';

const query = ref('');
const address = ref('');
const loading = ref(false);
const results = ref(null);

async function checkRequirements() {
  loading.value = true;
  try {
    results.value = await api.triage('demo-public', {
      query: query.value,
      address: address.value
    });
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## Specialist Prompt Template (example: Planning/Building)

**System**: “You are a planning assistant for Australian jurisdictions. Provide **information only**. Always cite official sources with URLs and retrieval dates. Ask minimal clarifying questions. Present steps as a checklist. Avoid legal advice or interpretations.”

**Instructions**:

- Inputs: `{intent, address, council, state, overlays?, props?}`
- Output fields: `{requirements[], contacts[], citations[], assumptions[], confidence}`
- Rules: prefer **official** sources; avoid forums. If ambiguous, present both possibilities and how to resolve.

---

## Conflict Flagging Heuristics

- Compare **thresholds** (heights, noise limits, hours, capacity) across instruments — if stricter local rule exists, label as **local stricter**.
- If multiple licences appear to cover the same activity (e.g., food premises vs temporary event food), prompt for **duration/frequency**.
- If Commonwealth safety/standards apply (e.g., product standards) plus state licence, mark as **both required**.

---

## Testing Scenarios

1. **Boundary fence** at a residential address (with/without heritage overlay).
2. **Open a café**: food business licence, possible liquor licence, signage permit, outdoor dining, trade waste, music/noise.
3. **Pop-up market**: temporary event approvals, road closure permits, public liability.
4. **Import packaged foods**: DAFF biosecurity, labelling (industry standards), ATO/GST.
5. **Home-based salon**: planning consent vs exempt, health approvals, advertising signage.

Each test should verify: jurisdiction resolution, links present, conflict flags, contacts, and disclaimers.

---

## Deployment & Ops

- **Encore.dev** cloud deployment for TypeScript backend with automatic infrastructure provisioning.
- **Vercel/Netlify** deployment for Vue.js frontend SPA with CDN and edge caching.
- **Background jobs** using Encore.dev's cron capabilities to re-fetch registry endpoints, refresh `last_checked`, and diff hashes.
- **Observability**: built-in Encore.dev tracing, metrics, and logs with request correlation.
- **Feature flags**: environment-based configuration to enable/disable domains per state while growing coverage.

---

## Roadmap

- Add address autocomplete + council lookup.
- Wizard UX for clarifying questions.
- Admin console to manage authorities, endpoints, and mapping quality.
- Export to **PDF** with plan + links + contacts.
- Accessibility & multilingual UI.
- Partner API: signed server-to-server key.

---

## Ready-to-Build Checklist

- [ ] Initialize Encore.dev TypeScript project with services structure.
- [ ] Scaffold Vue.js frontend with Vite and TypeScript configuration.
- [ ] Implement council/state resolver service and seed the authority registry.
- [ ] Add ABLIS/state portal adapters (read-only; cache metadata + URLs).
- [ ] Implement triage classifier and minimal specialist profiles (planning, business licences, events).
- [ ] Build Vue components for search, results display, and JSON export.
- [ ] Configure Encore.dev authentication, rate limiting, and CORS policies.
- [ ] Deploy to Encore.dev cloud and Vercel/Netlify for demo.
- [ ] Seed 10–15 end-to-end tests across different states using Vitest/Jest.
