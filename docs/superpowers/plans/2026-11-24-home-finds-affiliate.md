# Home & Kitchen Finds — US Affiliate Showcase & Pinterest Pin Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2-in-1 Next.js application combining a dev-only Vietnamese Admin & Pinterest Pin/Analytics Studio with a statically pre-rendered, Amazon-compliant US-English Home & Kitchen Finds Showcase website deployable for $0 on Vercel.

**Architecture:** One Next.js App Router (TypeScript + Tailwind CSS) repository at `d:\Anti_\home-finds-studio` backed by Git-tracked JSON files (`data/*.json`) and local uploaded images (`public/images/uploads/`). In local development (`NODE_ENV === 'development'`), `/studio` and `/api/studio/*` enable full CRUD, 1000×1500 HTML5 Canvas Pin generation, offline US-English Pinterest copy generation, and Traffic/Commission analytics with 1-click Amazon CSV import; in production, `/studio` and `/api/studio/*` return `404` while all public showcase pages pre-render statically with full Open Graph metadata.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Vitest, HTML5 Canvas API.

**Spec:** `d:\Anti_\home-finds-studio\docs\superpowers\specs\2026-11-24-home-finds-affiliate-design.md`

## Global Constraints

- Project root is `d:\Anti_\home-finds-studio` on Windows (Node v20.17.0, npm 10.9.0, git 2.56.1).
- Zero-cost operation: no paid APIs, no external database, no Docker required.
- Amazon Associates US compliance: mandatory text `"As an Amazon Associate I earn from qualifying purchases."` in footer, `/finds/[slug]`, `/collections/[slug]`, and `/disclosure`; no hardcoded dollar prices; all outbound Amazon links use `target="_blank"` and `rel="nofollow sponsored noopener noreferrer"` with CTA `"Check Latest Price on Amazon"`.
- Security isolation: `/studio` and `/api/studio/*` MUST be enabled ONLY when `process.env.NODE_ENV === 'development'` and return HTTP `404` / `notFound()` in production.
- Studio UI is in Vietnamese; Public Showcase website and generated Pinterest Pins/Copy are in natural US English.
- Ship with 6 sample Home & Kitchen products, 2 sample Collections, and sample analytics entries (all flagged `isSample: true`) plus local sample SVG/image assets so the site renders with zero broken images offline.

## Review Focus

- **Zero-division in analytics metrics:** When `views === 0` or `clicks === 0`, `ctr` and `conversionRate` must return `0` (never `NaN` or `Infinity`). Covered in Task 2.
- **Messy Amazon Associates CSV exports:** CSV files with UTF-8 BOM, quoted product titles containing commas, `$1,234.56` currency strings, or blank trailing lines must parse cleanly without crashing or producing `NaN` totals. Covered in Task 2.
- **Production exposure of `/studio` and `/api/studio/*`:** Any request to studio API handlers when `NODE_ENV !== 'development'` must immediately return HTTP `404` without reading or mutating files. Covered in Task 3.
- **Duplicate or non-ASCII product slugs:** Creating two products with the same title or Vietnamese/special characters must produce unique, clean URL-safe slugs (e.g., `spice-rack`, `spice-rack-2`). Covered in Task 1.
- **Pinterest title length & Canvas CORS errors:** Generated Pinterest titles must never exceed 100 characters, and external product image URLs routed through `/api/studio/image-proxy` must reject non-`http(s)` protocols to prevent local file disclosure. Covered in Tasks 2 & 3.

---

### Task 1: Project Scaffolding, Types, Seed Data & File Storage Layer

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`
- Create: `src/lib/types.ts`
- Create: `src/lib/studio-guard.ts`
- Create: `src/lib/storage.ts`
- Create: `data/site-config.json`, `data/products.json`, `data/collections.json`, `data/analytics.json`
- Create: `public/images/samples/` (6 clean SVG product illustrations so zero external image dependencies break offline)
- Test: `tests/storage.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/types.ts`: `ProductCategory`, `PriceBadge`, `PinTemplateId`, `SiteConfig`, `Product`, `Collection`, `AnalyticsEntry`, `PinterestCopyVariation`
  - `src/lib/studio-guard.ts`: `isStudioEnabled(): boolean`
  - `src/lib/storage.ts`: `slugify(text: string): string`, `ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string`, `isValidHttpUrl(url: string): boolean`, `readSiteConfig(dataDir?: string): SiteConfig`, `writeSiteConfig(config: SiteConfig, dataDir?: string): void`, `readProducts(dataDir?: string): Product[]`, `writeProducts(products: Product[], dataDir?: string): void`, `readCollections(dataDir?: string): Collection[]`, `writeCollections(collections: Collection[], dataDir?: string): void`, `readAnalytics(dataDir?: string): AnalyticsEntry[]`, `writeAnalytics(entries: AnalyticsEntry[], dataDir?: string): void`

- [ ] **Step 1: Initialize Next.js + Tailwind CSS + Vitest project in `d:\Anti_\home-finds-studio`**
  Create `package.json` (with scripts `dev`, `build`, `start`, `test: vitest run`, `typecheck: tsc --noEmit`), `next.config.ts` (`images: { unoptimized: true }`), `tsconfig.json`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, and run `npm install`.

- [ ] **Step 2: Write failing tests in `tests/storage.test.ts`**
  Assert:
  - `slugify("Under-Sink 2-Tier Organizer! (Kitchen)") === "under-sink-2-tier-organizer-kitchen"`
  - `slugify("Kệ gia vị 2 tầng") === "ke-gia-vi-2-tang"`
  - `ensureUniqueSlug("spice-rack", ["spice-rack", "spice-rack-2"]) === "spice-rack-3"`
  - `isValidHttpUrl("https://amzn.to/abc123") === true` and `isValidHttpUrl("javascript:alert(1)") === false`
  - `readProducts` / `writeProducts` round-trip correctly against a temporary directory.
  - `isStudioEnabled()` returns `true` when `NODE_ENV === "development"` and `false` when `NODE_ENV === "production"`.

- [ ] **Step 3: Run test to verify it fails**
  Run: `npm test -- tests/storage.test.ts`
  Expected: FAIL (modules not found).

- [ ] **Step 4: Implement `src/lib/types.ts`, `src/lib/studio-guard.ts`, `src/lib/storage.ts`**
  Define all shared types matching the spec (`ProductCategory = 'kitchen' | 'pantry' | 'bathroom' | 'organization'`, `PriceBadge = 'Under $25' | 'Under $50' | 'Best Seller' | 'Space Saver' | 'Gift Idea'`, etc.) and implement JSON read/write helpers with `fs.mkdirSync(..., { recursive: true })`.

- [ ] **Step 5: Create seed data in `data/*.json` and 6 crisp local sample product SVGs in `public/images/samples/`**
  - `data/site-config.json`: `siteName: "TidyNest Finds"`, `tagline: "Smart Home & Kitchen Finds That Make Everyday Living Effortless"`, `disclosureText: "As an Amazon Associate I earn from qualifying purchases."`, `usdToVndRate: 25400`, `baseUrl: "http://localhost:3000"`.
  - `data/products.json`: 6 realistic US Home & Kitchen products (`isSample: true`, placeholder `https://www.amazon.com/dp/SAMPLE001?tag=yourtag-20`).
  - `data/collections.json`: 2 curated listicles (`"5 Amazon Kitchen Organizers That Instantly Clear Counter Clutter"`, `"Cozy Home & Bathroom Upgrades Under $30"`).
  - `data/analytics.json`: 7 days of realistic sample traffic/click/order/commission rows (`isSample: true`).

- [ ] **Step 6: Run tests and verify pass**
  Run: `npm test -- tests/storage.test.ts`
  Expected: PASS (all tests green).

- [ ] **Step 7: Initialize git repo & commit**
  ```bash
  git init && git add . && git commit -m "feat: scaffold project, schemas, storage layer, and starter seed data"
  ```

---

### Task 2: Offline Pinterest Copy Generator & Analytics/CSV Engine

**Files:**
- Create: `src/lib/copy-generator.ts`
- Create: `src/lib/analytics-utils.ts`
- Test: `tests/copy-generator.test.ts`
- Test: `tests/analytics-utils.test.ts`

**Interfaces:**
- Consumes: `Product`, `Collection`, `AnalyticsEntry`, `PinterestCopyVariation` from `src/lib/types.ts`
- Produces:
  - `src/lib/copy-generator.ts`: `generateProductPinCopy(product: Product): PinterestCopyVariation[]`, `generateCollectionPinCopy(collection: Collection, products: Product[]): PinterestCopyVariation[]`
  - `src/lib/analytics-utils.ts`: `AnalyticsSummary` interface, `computeAnalyticsSummary(entries: AnalyticsEntry[], usdToVndRate: number): AnalyticsSummary`, `parseAmazonAssociatesCsv(csvText: string): Omit<AnalyticsEntry, 'id'>[]`

- [ ] **Step 1: Write failing tests in `tests/copy-generator.test.ts` and `tests/analytics-utils.test.ts`**
  Assert:
  - `generateProductPinCopy` returns exactly 3 variations; every `title.length <= 100`; every `description` includes a soft CTA and disclosure note; every `hashtags` array has 5–8 items starting with `#`.
  - `generateCollectionPinCopy` returns 3 listicle variations referencing the item count and collection title, `title.length <= 100`.
  - `computeAnalyticsSummary([], 25400)` returns `ctr: 0`, `conversionRate: 0`, `totalViews: 0`, `totalClicks: 0`, `totalOrders: 0`, `totalRevenueUsd: 0`, `totalCommissionUsd: 0`, `totalCommissionVnd: 0`, `threeSalesProgress: { current: 0, target: 3, percent: 0, completed: false }`.
  - `computeAnalyticsSummary(sampleEntries, 25000)` accurately computes CTR, conversion rate, USD/VND commission, daily series sorted by date ascending, and `topProducts` sorted by `commissionUsd` desc then `clicks` desc.
  - `parseAmazonAssociatesCsv` handles UTF-8 BOM, quoted titles with commas (`"Organizer, 2-Tier"`), currency strings (`"$1,245.50"`), blank lines, and maps standard Amazon Associates columns (`Date`, `Product`/`Name`, `Clicks`, `Ordered Items`/`Shipped Items`, `Shipped Revenue`/`Revenue`, `Advertising Fees`/`Ad Fees`/`Commission`).

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm test -- tests/copy-generator.test.ts tests/analytics-utils.test.ts`
  Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/copy-generator.ts` and `src/lib/analytics-utils.ts`**
  Implement the 3 distinct US-English Pinterest copy angles (1: Problem-Solution Hook, 2: Aesthetic / Must-Have Hook, 3: Gift / Budget-Smart Hook) and the RFC-4180-safe CSV parser + analytics aggregator.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm test -- tests/copy-generator.test.ts tests/analytics-utils.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/copy-generator.ts src/lib/analytics-utils.ts tests/copy-generator.test.ts tests/analytics-utils.test.ts
  git commit -m "feat: add offline US Pinterest copy generator and Amazon CSV analytics engine"
  ```

---

### Task 3: Dev-Only Studio API Routes

**Files:**
- Create: `src/app/api/studio/products/route.ts`
- Create: `src/app/api/studio/collections/route.ts`
- Create: `src/app/api/studio/analytics/route.ts`
- Create: `src/app/api/studio/config/route.ts`
- Create: `src/app/api/studio/upload/route.ts`
- Create: `src/app/api/studio/image-proxy/route.ts`
- Test: `tests/studio-api.test.ts`

**Interfaces:**
- Consumes: `isStudioEnabled` from `src/lib/studio-guard.ts`, storage helpers from `src/lib/storage.ts`, `parseAmazonAssociatesCsv` from `src/lib/analytics-utils.ts`
- Produces: REST JSON endpoints (dev-only; all return `404` when `!isStudioEnabled()`):
  - `GET/POST/PUT/DELETE /api/studio/products`
  - `GET/POST/PUT/DELETE /api/studio/collections`
  - `GET/POST/DELETE /api/studio/analytics` (supports `mode: "manual" | "csv"` on POST and `scope: "samples" | "id"` on DELETE)
  - `GET/PUT /api/studio/config`
  - `POST /api/studio/upload` (multipart form `file`, accepts png/jpg/jpeg/webp/svg ≤ 5MB, saves to `public/images/uploads/`, returns `{ url }`)
  - `GET /api/studio/image-proxy?url=<encoded>` (dev-only CORS proxy; strictly rejects non-`http(s)` URLs with `400`)

- [ ] **Step 1: Write failing tests in `tests/studio-api.test.ts`**
  Assert:
  - Calling `GET` / `POST` on `products/route.ts` and `image-proxy/route.ts` when `NODE_ENV === "production"` returns status `404`.
  - Calling `image-proxy/route.ts` in development with `file:///C:/Windows/win.ini` returns status `400`.
  - Calling `POST` on `products/route.ts` with an invalid affiliate URL (`javascript:alert(1)`) returns status `400`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- tests/studio-api.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement all 6 route handlers under `src/app/api/studio/`**
  Every handler checks `if (!isStudioEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });` at the top.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- tests/studio-api.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/api/studio tests/studio-api.test.ts
  git commit -m "feat: add dev-only Studio API routes with production 404 guard"
  ```

---

### Task 4: Public US Showcase Website & Amazon Compliance Pages

**Files:**
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/components/AffiliateButton.tsx`, `src/components/ProductCard.tsx`, `src/components/HomeDiscovery.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/finds/[slug]/page.tsx`
- Create: `src/app/collections/[slug]/page.tsx`
- Create: `src/app/about/page.tsx`, `src/app/disclosure/page.tsx`, `src/app/privacy/page.tsx`

**Interfaces:**
- Consumes: `readSiteConfig`, `readProducts`, `readCollections` from `src/lib/storage.ts`, `isStudioEnabled` from `src/lib/studio-guard.ts`
- Produces: Static US-English Showcase routes with `generateStaticParams()` and `generateMetadata()` (Open Graph & Pinterest tags).

- [ ] **Step 1: Build global warm cozy-home editorial theme (`src/app/layout.tsx`, `src/app/globals.css`)**
  Configure Google Fonts (`Fraunces` display serif + `Plus Jakarta Sans` sans-serif), warm cream `#FAF7F2` background, deep espresso `#1F1B18` text, terracotta `#C25E3A` accent, sage `#4D6B57` secondary accent, and conditional GA4 `<Script>` when `config.gaMeasurementId` is set.

- [ ] **Step 2: Build shared public UI components**
  - `SiteHeader.tsx`: Brand wordmark, nav links (`Finds`, `Collections`, `About`), Pinterest follow button, plus a subtle dev-only `"Mở Studio"` pill shown ONLY when `isStudioEnabled()` is true.
  - `SiteFooter.tsx`: Mandatory Amazon Associates disclosure (`"As an Amazon Associate I earn from qualifying purchases."`) + links to `/about`, `/disclosure`, `/privacy`.
  - `AffiliateButton.tsx`: Client component rendering `"Check Latest Price on Amazon"` with `target="_blank"`, `rel="nofollow sponsored noopener noreferrer"`, firing `window.gtag?.('event', 'affiliate_click', ...)` on click.
  - `ProductCard.tsx` & `HomeDiscovery.tsx`: Interactive category filter pills (`All`, `Kitchen`, `Pantry`, `Bathroom`, `Home Organization`, `Under $25`), live search, featured collections grid, and responsive product grid.

- [ ] **Step 3: Build public pages (`/`, `/finds/[slug]`, `/collections/[slug]`, `/about`, `/disclosure`, `/privacy`)**
  - `/finds/[slug]`: High-res image, badge, `"Why People Love It"` highlights, `AffiliateButton`, inline disclosure note, related finds, and Open Graph `generateMetadata`.
  - `/collections/[slug]`: Editorial numbered listicle (`#1`, `#2`, ...), disclosure banner, individual `AffiliateButton` per item, and Open Graph `generateMetadata`.
  - `/about`, `/disclosure`, `/privacy`: Authentic US-English pages meeting Amazon Associates review standards.

- [ ] **Step 4: Verify TypeScript & production build**
  Run: `npm run typecheck && npm run build`
  Expected: PASS with static pages generated for all sample products and collections.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app src/components
  git commit -m "feat: build US Home & Kitchen Showcase website and Amazon compliance pages"
  ```

---

### Task 5: Local Vietnamese Studio — Products, Collections, Analytics & Settings Tabs

**Files:**
- Create: `src/app/studio/page.tsx`
- Create: `src/components/studio/StudioWorkspace.tsx`
- Create: `src/components/studio/ProductsTab.tsx`
- Create: `src/components/studio/CollectionsTab.tsx`
- Create: `src/components/studio/AnalyticsTab.tsx`
- Create: `src/components/studio/SettingsTab.tsx`

**Interfaces:**
- Consumes: `/api/studio/*` endpoints, `computeAnalyticsSummary` from `src/lib/analytics-utils.ts`, `isStudioEnabled` from `src/lib/studio-guard.ts`
- Produces: Dev-only `/studio` Vietnamese admin workspace with 5 tabs (`Sản phẩm`, `Bộ sưu tập`, `Xưởng Pin`, `Báo cáo & Hoa hồng`, `Cài đặt & Xuất bản`), wiring `PinStudioTab` slot cleanly for Task 6.

- [ ] **Step 1: Create `src/app/studio/page.tsx` with production `notFound()` guard**
  Server component checking `if (!isStudioEnabled()) notFound();`, loading initial config, products, collections, and analytics, and passing them to `<StudioWorkspace />`.

- [ ] **Step 2: Build `ProductsTab.tsx` and `CollectionsTab.tsx` (Vietnamese UI)**
  - `ProductsTab`: Table/cards of products (sample badge indicator), Add/Edit/Delete form (EN title, category, badge, Amazon affiliate link, image upload via `/api/studio/upload` or image URL, EN short pitch, EN highlights, featured toggle), and `"Tạo ảnh Pin"` quick-action button switching to the Pin tab with that product pre-selected.
  - `CollectionsTab`: Create/Edit/Delete listicles with multi-select product checkboxes, cover image picker, preview link to `/collections/[slug]`, and `"Tạo ảnh Pin bộ sưu tập"` quick-action button.

- [ ] **Step 3: Build `AnalyticsTab.tsx` (Traffic, Clicks, Conversion Rate, Revenue & Actual Commissions)**
  - 6 KPI cards: Tổng lượt xem (`Views`), Tổng lượt click (`Clicks`), Tỷ lệ click (`CTR %`), Tỷ lệ chuyển đổi (`Conversion Rate %`), Doanh thu đơn hàng (`USD`), và **Hoa hồng thực nhận (`USD` + tự động quy đổi `VNĐ`)**.
  - Thanh tiến độ **Mốc 3 đơn đầu tiên của Amazon Associates (`X / 3 đơn`)**.
  - Biểu đồ cột/đường SVG sạch đẹp theo ngày (Views / Clicks / Hoa hồng) + bảng **Top sản phẩm kiếm tiền tốt nhất**.
  - **Import file CSV báo cáo từ Amazon Associates (1 click)** + form **Nhập nhanh số liệu** (ngày, nguồn Pinterest/Web/Amazon, sản phẩm tùy chọn, views, clicks, orders, doanh thu USD, hoa hồng USD) + nút `"Xóa dữ liệu mẫu"` khi chạy thật.

- [ ] **Step 4: Build `SettingsTab.tsx` and `StudioWorkspace.tsx`**
  - Edit `siteName`, `tagline`, `pinterestUrl`, `gaMeasurementId`, `usdToVndRate`, `baseUrl`.
  - Include a step-by-step Vietnamese checklist for: (1) Đăng ký Amazon Associates US + Pinterest Business, (2) Thay sản phẩm mẫu bằng link thật, (3) Đẩy web lên Vercel miễn phí (`git add . && git commit -m "Update finds" && git push`).

- [ ] **Step 5: Verify TypeScript compiles cleanly**
  Run: `npm run typecheck`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/app/studio src/components/studio
  git commit -m "feat: build Vietnamese Studio tabs for products, collections, analytics, and settings"
  ```

---

### Task 6: 1000×1500 Canvas Pin Generator, Vietnamese README & Final Verification

**Files:**
- Create: `src/lib/pin-renderer.ts`
- Create: `src/components/studio/PinStudioTab.tsx`
- Modify: `src/components/studio/StudioWorkspace.tsx` (wire `PinStudioTab`)
- Create: `README.md`

**Interfaces:**
- Consumes: `generateProductPinCopy`, `generateCollectionPinCopy` from `src/lib/copy-generator.ts`; `/api/studio/image-proxy`
- Produces:
  - `src/lib/pin-renderer.ts`: `PinRenderOptions` interface, `PIN_WIDTH = 1000`, `PIN_HEIGHT = 1500`, `renderPinToCanvas(canvas: HTMLCanvasElement, options: PinRenderOptions): Promise<void>` supporting 3 templates (`editorial`, `bold-banner`, `listicle-collage`).

- [ ] **Step 1: Implement `src/lib/pin-renderer.ts`**
  Draw crisp `1000×1500px` Pins with automatic word-wrapping, object-cover image cropping, safe CORS loading (routing external `http(s)` image URLs through `/api/studio/image-proxy?url=...`), and 3 templates:
  1. `editorial`: Warm cream `#FAF7F2` canvas, rounded product photo, top pill badge, bold serif headline, brand domain footer.
  2. `bold-banner`: Deep espresso or terracotta top banner (`"AMAZON KITCHEN MUST-HAVE"`), full-bleed product photo below, floating price-tier badge (`"Under $25"`).
  3. `listicle-collage`: 2×2 product photo collage with a clean centered editorial title card (ideal for Collections).

- [ ] **Step 2: Build `PinStudioTab.tsx` and wire into `StudioWorkspace.tsx`**
  - Target selector (any Product or Collection).
  - Left column: Template picker (3 templates), Color theme picker (Warm Cream / Terracotta / Sage / Espresso), editable Pin Headline & Badge text, Destination Showcase URL with 1-click Copy, and **3 US-English Pinterest Copy Variations** (Title + Description + Hashtags, each with 1-click Copy).
  - Right column: Live scaled preview of the `1000×1500` canvas + `"Tải ảnh Pin (PNG 1000×1500)"` 1-click download button.

- [ ] **Step 3: Write clear Vietnamese `README.md`**
  Include: cách chạy trên máy (`npm run dev`), đường dẫn Studio (`http://localhost:3000/studio`), cách đưa web lên mạng miễn phí bằng Vercel, cách gắn Google Analytics 4, và quy trình hàng ngày 2 phút tạo Pin & import báo cáo Amazon CSV.

- [ ] **Step 4: Run full verification suite**
  Run: `npm test && npm run typecheck && npm run build`
  Expected: All Vitest tests PASS, zero TypeScript errors, production Next.js build succeeds cleanly.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/pin-renderer.ts src/components/studio/PinStudioTab.tsx src/components/studio/StudioWorkspace.tsx README.md
  git commit -m "feat: add 1000x1500 Pinterest Pin generator studio and Vietnamese README"
  ```
