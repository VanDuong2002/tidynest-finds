# Home & Kitchen Finds — US Affiliate Showcase & Pinterest Pin Studio Design

**Date:** 2026-11-24  
**Project Folder:** `d:\Anti_\home-finds-studio`  
**Brand Name (Configurable):** *TidyNest Finds* (editable in `data/site-config.json`)  
**Scope Size:** Full Project (v1 MVP)

---

## 1. Intent & The Why

The user is a complete beginner in international affiliate marketing whose goal is to generate USD side income with **$0 upfront ad spend** and the **fastest realistic path to first commissions** (including reaching Amazon Associates US's mandatory 3 qualifying sales within 180 days).

Instead of waiting 3–6 months for Google SEO on a brand-new domain, this project targets **Pinterest US** — a high-intent visual shopping search engine where new accounts can get impressions within days/weeks without showing a face or recording videos — driving US shoppers to a clean, trustworthy **Home & Kitchen Finds Showcase website** that links out to **Amazon US**.

Because the user is operating from Vietnam and is new to US affiliate copywriting and graphic design, the project combines:
1. A **Local Studio (Vietnamese UI, English output)** running only on the user's PC to add products, curate listicles, auto-generate US-English Pinterest SEO copy, and render ready-to-upload `1000×1500px` vertical Pinterest Pin images in one click.
2. A **Public US Showcase Website (US English)** deployed for free, designed like a curated home-organization magazine so US Pinterest shoppers trust the recommendations and click through to Amazon.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Fast daily workflow:** Go from finding a winning Amazon Home & Kitchen product to having a published showcase page + downloadable `1000×1500` Pinterest Pin PNG + US-English Pin title/description/hashtags in under 2 minutes.
- **100% Amazon Associates US compliant:**
  - Mandatory disclosure (*"As an Amazon Associate I earn from qualifying purchases."*) visible in site footer, product pages, collection pages, and a dedicated `/disclosure` page.
  - No static hardcoded dollar prices (forbidden without PA-API); use safe price-tier badges (`Under $25`, `Under $50`, `Kitchen Favorite`, `Space Saver`) and a `"Check Latest Price on Amazon"` CTA button with `rel="nofollow sponsored noopener noreferrer"`.
  - Include `/about` and `/privacy` pages required for Amazon Associates account review.
- **Zero-cost operation:** Works completely offline/locally with **$0 API fees** and deploys for **$0/month** on Vercel Free Tier (with zero external database setup).
- **Multi-item conversion via Collections:** Support both single-product pages (`/finds/[slug]`) and curated listicles (`/collections/[slug]`, e.g., *"5 Amazon Kitchen Organizers That Instantly Clear Counter Clutter"*) so one Pinterest Pin can drive multiple Amazon clicks.
- **Ready to use out of the box:** Ship with 6 realistic sample Home & Kitchen products and 2 sample Collections (clearly marked as sample items with placeholder affiliate links) so the user immediately sees a complete, polished site and can replace/add real products.

### Non-Goals (v1)
- No cloud database, online login, or mobile admin editing (deferred to a potential v2 once commissions come in).
- No automated Pinterest posting bots or headless browser uploaders (risks Pinterest account suspension).
- No Amazon Product Advertising API (PA-API) integration or Amazon HTML price scraping (PA-API is unavailable prior to 3 qualifying sales; scraping violates TOS).
- No paid ads tooling or multi-network aggregation beyond Amazon US links (though any valid URL works in the link field).

### Anti-Goals (Failure Modes to Avoid)
- **Amazon TOS violation:** Hardcoding prices, missing disclosures, or cloaking affiliate links deceptively.
- **Low-trust / spammy look:** Generic templates or unnatural English that cause US Pinterest shoppers to bounce immediately.
- **Setup friction:** Requiring Docker, Supabase accounts, or paid OpenAI/Gemini API keys before the user can generate their first Pin and deploy their first page.

---

## 3. Approaches Considered

### Approach 1 (Selected): 2-in-1 Local Studio + Static Public Showcase (Single Next.js App)
- **How it works:** One Next.js (App Router) + Tailwind CSS project. Locally (`npm run dev`), `/studio` and `/api/studio/*` provide a full Vietnamese management & Pin-creation workspace that reads/writes JSON files (`data/*.json`) and uploaded images (`public/images/*`) directly on disk. In production (Vercel), `/studio` and `/api/studio/*` are strictly disabled (return `404`), and all public pages are statically pre-rendered with full Open Graph / Pinterest metadata.
- **Trade-offs:** Publishing new products requires running a quick git push from the PC (not editable from a phone). In exchange: $0 cost, zero database setup, instant US page loads, and fastest path to launch.
- **Why selected:** Best balance of speed, zero cost, and professional quality for a first-time affiliate marketer.

### Approach 2 (Deferred): Full-Stack Web App with Cloud DB & Online `/admin` (Next.js + Supabase)
- **How it works:** Same features, plus online `/admin` authentication (editable from phone) and built-in server-side click analytics stored in Supabase.
- **Trade-offs:** Requires creating and configuring external database/auth accounts upfront before launching. Better suited as a v2 upgrade after validating traffic and first commissions.

### Approach 3 (Rejected): Local Pin Generator Only (Direct `amzn.to` Links on Pinterest)
- **How it works:** Desktop/local tool that only exports Pin images and English copy for posting direct Amazon short links on Pinterest.
- **Trade-offs:** High risk of Pinterest spam flags/throttling for new accounts posting raw affiliate links, cannot host multi-product listicles, and builds no owned web asset.

---

## 4. Technical Architecture & Decisions (Agent Calls)

*The user focused on outcomes and delegated technical stack choices. The following are engineering calls for the user to review:*

- **Framework:** Next.js (App Router, TypeScript) + Tailwind CSS.
  - Reason: Single unified codebase for both the local Studio (with local file-write API routes) and the SEO-friendly, statically pre-rendered US Showcase site. Free zero-config deployment on Vercel.
- **Data Storage (File-Based JSON in Git):**
  - `data/site-config.json`: Site name, tagline, Amazon Associate disclosure text, optional `gaMeasurementId` (GA4), social links (Pinterest profile URL).
  - `data/products.json`: Array of product objects (`id`, `slug`, `title`, `category`, `badge`, `affiliateUrl`, `imageUrl`, `shortPitch`, `highlights[]`, `featured`, `isSample`, `createdAt`).
  - `data/collections.json`: Array of collection/listicle objects (`id`, `slug`, `title`, `subtitle`, `coverImageUrl`, `productIds[]`, `intro`, `isSample`, `createdAt`).
  - `data/analytics.json`: Array of tracking entries (`id`, `date`, `source`, `productId?`, `productName?`, `views`, `clicks`, `orders`, `revenueUsd`, `commissionUsd`, `notes?`, `isSample`) powering the Studio traffic & earnings dashboard.
  - Uploaded product images saved to `public/images/uploads/<timestamp>-<sanitized-name>.<ext>`.
- **Environment Isolation (Security Guard):**
  - Every `/studio` page and `/api/studio/*` route checks `process.env.NODE_ENV === 'development'`. Outside development (e.g., production build on Vercel), `/studio` calls `notFound()` and `/api/studio/*` returns HTTP `404`. No admin surface is exposed publicly.
- **Client-Side Pin Image Generator (`1000×1500px` PNG):**
  - Built with HTML5 `<canvas>` directly in the browser inside `/studio` — zero server image-processing dependencies, works reliably on Windows, instant live preview, 1-click PNG download.
  - Handles CORS-safe images by proxying external image URLs through a dev-only local route (`/api/studio/image-proxy`) or using locally uploaded images in `public/images/uploads/` so `<canvas>.toDataURL()` never fails with tainted-canvas errors.
  - Provides **3 high-converting US Pinterest templates**:
    1. *Editorial Clean Card* (Warm cream background, rounded product photo, serif headline, subtle `"Amazon Kitchen Find"` pill, brand footer).
    2. *Bold Top Banner* (High-contrast top banner e.g. `"AMAZON FINDS YOU NEED"`, full-bleed product photo below, floating badge like `"Under $25"`).
    3. *Listicle Collage* (For Collections: 2×2 or 3-photo grid with centered bold title card e.g. `"5 Amazon Kitchen Organizers"`).
- **Offline English Pinterest Copy Generator:**
  - Deterministic, curated US-English template engine built into `/studio` that takes product title, category, badge, and highlights and produces **3 ready-to-paste Pinterest variations** (Title ≤ 100 chars, SEO Description ~200–350 chars with soft CTA + affiliate note, and 5–8 niche hashtags), each with a 1-click Copy button.
  - Works 100% offline with $0 cost. No external AI API key required.
- **Outbound Click & Traffic Tracking (Optional Free GA4) + Studio Analytics & Commission Dashboard:**
  - All `"Check Latest Price on Amazon"` buttons fire a lightweight `gtag('event', 'affiliate_click', { product_slug, product_title, source_page })` when `gaMeasurementId` is configured in `data/site-config.json`, automatically capturing live page views and outbound clicks in free Google Analytics 4.
  - Because Amazon Associates US does **not** expose an API to pull order revenue or earned commissions automatically, `/studio` includes a dedicated **Analytics & Commission Dashboard** backed by `data/analytics.json` (plus an optional USD→VND exchange rate in `data/site-config.json`):
    - **1-Click Amazon Associates CSV Importer:** Parses standard Amazon Associates Fee/Orders CSV exports (extracting date/product, clicks, ordered/shipped items, shipped revenue, and advertising fees / actual commission) and merges them into `data/analytics.json`.
    - **Quick Manual Entry:** Lets the user log periodic Pinterest impressions/views, site views, clicks, orders, revenue, and actual commissions in seconds.
    - **Computed Metrics & Visuals:** Automatically computes CTR (`clicks / views`), Conversion Rate (`orders / clicks`), total shipped revenue (USD), actual earned commission (USD + estimated VND), an **Amazon 3-First-Sales Progress Tracker** (`X / 3 qualifying sales`), a clean trend chart (Views / Clicks / Commission), and a Top-Performing Products breakdown.
    - Ships with clearly marked sample analytics entries and a 1-click `"Xóa dữ liệu mẫu"` button when the user goes live.
- **Categories (Home & Kitchen Finds):**
  - `kitchen` (Kitchen & Cooking)
  - `pantry` (Pantry & Fridge)
  - `bathroom` (Bathroom & Vanity)
  - `organization` (Home Organization)
  - `under-25` (Filter tag/view for items with `Under $25` badge)

---

## 5. User Flows & Screens

### A. Public US Showcase Website (US English)
1. **Home Page (`/`)**:
   - Warm editorial header with brand name, navigation (`Finds`, `Collections`, `About`), and Pinterest follow link.
   - Compact hero section (*"Smart Home & Kitchen Finds That Make Everyday Living Effortless"*).
   - Featured Collections row (e.g., *"5 Amazon Kitchen Organizers Under $30"*).
   - Interactive category filter tabs + search box + responsive product card grid. Each card shows photo, badge (`Under $25`, `Space Saver`, etc.), English title, 1-line pitch, `"View Details"` and `"Check Price on Amazon"` CTA.
   - Footer with mandatory Amazon Associates disclosure and links to `/disclosure`, `/privacy`, `/about`.
2. **Product Detail Page (`/finds/[slug]`)**:
   - Large product photo, category + badge, English title, short pitch, `"Why People Love It"` bullet list.
   - Primary CTA button: `"Check Latest Price on Amazon"` (opens in new tab, `rel="nofollow sponsored noopener noreferrer"`).
   - Compact inline affiliate disclosure note right below the CTA.
   - `"More Finds You Might Like"` related products grid.
   - Full Open Graph & Pinterest meta tags (`og:title`, `og:description`, `og:image`).
3. **Collection / Listicle Page (`/collections/[slug]`)**:
   - Editorial header with title, intro, and disclosure note.
   - Numbered product sections (`#1`, `#2`, ...) with photo, why-it's-great pitch, highlights, and individual `"Check Latest Price on Amazon"` button.
4. **Compliance Pages (`/about`, `/disclosure`, `/privacy`)**:
   - Clean, authentic English copy written for US shoppers and Amazon Associates reviewers.

### B. Local Studio (`/studio` — Vietnamese UI, Dev-Only)
1. **Tab 1 — Quản lý Sản phẩm (Products):**
   - List of all products (with badge indicating sample vs real).
   - Add / Edit / Delete form: Product Name (EN), Category, Price-Tier Badge, Amazon Affiliate Link (validates URL format), Product Image (upload from PC or paste URL), Short Pitch (EN), Highlights (EN bullets), Featured toggle.
   - Quick button on each product: `"Tạo ảnh Pin"` (jumps straight to Pin Generator pre-loaded with that product).
2. **Tab 2 — Bộ sưu tập (Collections / Top Lists):**
   - Create / Edit / Delete listicles by picking multiple existing products, giving an English title & intro, and previewing the live collection URL.
   - Quick button: `"Tạo ảnh Pin bộ sưu tập"`.
3. **Tab 3 — Xưởng tạo ảnh Pin & Nội dung Pinterest (Pin & Copy Studio):**
   - Select any Product or Collection.
   - Left column: Template picker (3 templates), editable Pin Headline / Sub-badge / Color theme, and **Copy Generator** showing 3 US-English Pinterest Title + Description + Hashtags variations with 1-click Copy buttons + destination Showcase URL to paste into Pinterest's link field.
   - Right column: Live `1000×1500` Canvas preview + `"Tải ảnh Pin (PNG 1000×1500)"` 1-click download button.
4. **Tab 4 — Báo cáo Traffic & Hoa hồng (Analytics & Commission Dashboard):**
   - Top KPI cards: Tổng lượt xem (Views), Tổng lượt click (Clicks), Tỷ lệ click (CTR %), Tỷ lệ chuyển đổi (Conversion Rate %), Doanh thu tạo ra (USD), và **Hoa hồng thực nhận (USD + quy đổi VNĐ)**.
   - Progress bar tracking the mandatory **Amazon Associates 3-First-Sales milestone** (`0/3` → `3/3`).
   - Visual trend chart (Views, Clicks, Commission over time) + Top Products table ranked by clicks and commission.
   - **Import CSV Amazon Associates (1 click)** + **Nhập nhanh số liệu** form (date, source Pinterest/Web/Amazon, optional product link, views, clicks, orders, revenue USD, commission USD) + `"Xóa dữ liệu mẫu"` reset button.
5. **Tab 5 — Cài đặt & Xuất bản (Settings & Publish Guide):**
   - Edit Site Name, Tagline, Pinterest Profile URL, optional GA4 Measurement ID, USD→VND display rate, and Base Production URL (so the Studio shows the exact public link to paste into Pinterest!).
   - Clear Vietnamese checklist for: (1) Replacing sample products, (2) Publishing updates to Vercel (`git add . && git commit -m "Update finds" && git push`), and (3) Amazon Associates + Pinterest Business onboarding steps.

---

## 6. What Is Left to the Builder

- Exact Tailwind color palette, font pairing (e.g., Google Fonts serif display + clean sans-serif body matching a warm US cozy-home aesthetic), and responsive spacing details.
- Exact `<canvas>` typography wrapping, image object-cover cropping, and layout coordinates for the 3 Pin templates.
- Slug generation helper (unique, URL-safe slugs) and form validation error messages in Vietnamese.
- Unit/component verification tests (e.g., data schema validation, slug generation, copy generator output rules, production-mode 404 guard on `/studio` and `/api/studio/*`) and full `npm run build` verification.
