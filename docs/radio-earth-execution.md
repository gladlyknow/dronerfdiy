# Radio Earth execution plan

Status: active
Product owner: DroneRF DIY
Baseline: React 19 + Vite + Bun + Cloudflare Worker/D1/Static Assets

## Decisions that must not drift

- DroneRF DIY remains the parent brand; Radio Earth is the radio product.
- Existing CN A/B/C source banks, integrity gates, exam simulator, wrong-book, tools, account sync, and `/drone/` stay in place.
- `/radio/` is the only canonical radio namespace. Every `/redio/*` request is a permanent edge redirect that preserves its suffix and query string.
- Language and market are independent: `cn/zh`, `cn/en`, `us/en`, and `us/zh`.
- Regulatory content is localized, not mechanically translated.
- Radio Earth is receive/learn/explore only. V1 does not add RF transmission.
- Third-party data is fetched through Worker provider adapters and cached; browsers never receive provider secrets.
- Legal, question-pool, and band-plan facts require an official source record and review date.

## Milestone 0 — canonical URLs and SEO foundation

Acceptance criteria:

- `/radio/` is an approachable Radio Earth landing page; CRAC/FCC details appear only inside their market license areas.
- CN exam and tools remain operational at real `/radio/cn/...` paths.
- Four market/language combinations have switchable URLs and locale metadata.
- Initial public routes produce useful static HTML before JavaScript runs.
- Each indexable page has one canonical, four locale alternates plus `x-default`, Open Graph/Twitter metadata, breadcrumbs, JSON-LD, sources, and `lastReviewed`.
- `/sitemap.xml`, `/sitemap-cn.xml`, `/sitemap-us.xml`, and `/robots.txt` are generated from one route manifest.
- No production HTML depends on Google Fonts; system font stacks cover mainland China and global clients.
- Existing bank, HAM-tool, answer-key, TypeScript, build, redirect, and browser gates pass.

## Milestone 1 — CN and US licensing

### CN issues

1. Split the A/B/C guides, question banks, simulators, and tools into indexable route shells without duplicating bank data.
2. Publish the license hub, A/B/C pages, exam/question-bank pages, license-vs-station-license guide, callsign guide, privileges, bands, and exam-calendar shell.
3. Surface the 2025 bank counts, source version, effective date, manifest hash, and last verification date in static content.

### US issues

1. Implement official-source ingestion for Technician, General, and Amateur Extra question pools.
2. Reuse the CN pipeline shape: source -> import -> generated data -> manifest -> SHA-256 -> build gate.
3. Publish the license hub and the first high-intent route cluster.
4. Embed a real Technician practice exam only after the current NCVEC pool passes integrity checks.

Required source priority:

- US: FCC -> NCVEC -> ARRL.
- CN: MIIT -> CRAC -> provincial radio authorities.

Minimum source record:

```ts
interface SourceRecord {
  country: 'CN' | 'US';
  topic: string;
  sourceUrl: string;
  sourceType: 'regulator' | 'question_pool' | 'association';
  sourceVersion: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  lastChecked: string;
  reviewStatus: 'draft' | 'verified' | 'retired';
}
```

## Milestone 2 — Radio Earth MVP

Create shared Worker adapters:

```ts
interface RadioProvider<T> {
  id: string;
  fetch(signal: AbortSignal): Promise<T>;
  maxAgeSeconds: number;
}
```

Initial providers and caches:

- SatNOGS satellite metadata/TLE: metadata 24 h, TLE 6–12 h.
- NOAA SWPC space weather: 5–15 min.
- Receiver status: 30 s.

The UI must label every dataset as `LIVE`, `NEAR LIVE`, `RECENT`, `RECORDED`, or `PREDICTED`; these states may not be implied from styling alone.

## Milestone 3 — propagation

- Normalize PSK Reporter/WSPR/research inputs behind a `PropagationSpot` model.
- Ship band conditions and observed paths before prediction-heavy features.
- Never make a research/community source the only permanent provider.

## Milestone 4 — listen

- Start with verified OpenWebRX/self-hosted receiver nodes.
- A receiver is `LIVE` only when its stream and status probe both pass.
- Recorded audio is always labelled `RECORDED` with its capture time.

## Milestone 5 — growth

- PWA, notifications, exam calendar, alerts, content expansion, and privacy-conscious analytics.
- North-star events: `exam_session_completed` and `signal_exploration`.

## Explicitly deferred from V1

- RF transmission, native mobile apps, full SDR/spectrum analyser, contest logging, QSL/social/chat, complex VOACAP, full AI signal identification, and community hardware production.

## Release gate

Every production release must pass:

1. Source-bank/HAM/answer-key verification.
2. TypeScript and production builds.
3. Static-route, canonical/hreflang/schema, sitemap, and 301 checks.
4. Desktop/mobile browser smoke tests with no console errors or horizontal overflow.
5. Cloudflare dry run, D1 migration check, production deploy, and live route/API checks.
