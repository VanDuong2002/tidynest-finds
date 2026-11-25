import type { PriceBadge, ProductCategory } from "./types";

export interface NormalizedAffiliateLink {
  url: string;
  asin: string | null;
  tagged: boolean;
}

export interface ParsedAmazonProduct {
  title: string;
  imageUrl: string;
  priceUsd?: number;
  highlights: string[];
  blocked: boolean;
}

const ASIN_PATTERNS: RegExp[] = [
  /\/dp\/([A-Z0-9]{10})(?:[/?#]|$)/i,
  /\/gp\/product\/([A-Z0-9]{10})(?:[/?#]|$)/i,
  /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?#]|$)/i,
  /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:[/?#]|$)/i,
  /[?&]asin=([A-Z0-9]{10})(?:&|$)/i,
];

export function isValidAssociateTag(tag: string): boolean {
  const trimmed = tag.trim();
  if (!trimmed) return true;
  return /^[a-z0-9][a-z0-9._-]{1,40}$/i.test(trimmed);
}

export function extractAsin(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^B0[A-Z0-9]{8}$/i.test(trimmed) || /^[A-Z0-9]{10}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  for (const pattern of ASIN_PATTERNS) {
    const match = pattern.exec(trimmed);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

export function buildAffiliateUrl(
  input: string,
  associateTag?: string
): NormalizedAffiliateLink {
  const trimmed = input.trim();
  const cleanTag = (associateTag ?? "").trim();
  const asin = extractAsin(trimmed);

  if (asin) {
    const base = `https://www.amazon.com/dp/${asin}`;
    if (cleanTag) {
      return {
        url: `${base}?tag=${encodeURIComponent(cleanTag)}`,
        asin,
        tagged: true,
      };
    }
    return { url: base, asin, tagged: false };
  }

  // If it's already a valid Amazon URL without an extractable ASIN, attach tag if possible
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      cleanTag &&
      (host === "amazon.com" ||
        host.endsWith(".amazon.com") ||
        host === "smile.amazon.com")
    ) {
      parsed.searchParams.set("tag", cleanTag);
      return { url: parsed.toString(), asin: null, tagged: true };
    }
    return {
      url: trimmed,
      asin: null,
      tagged: parsed.searchParams.has("tag") || host === "amzn.to",
    };
  } catch {
    return { url: trimmed, asin: null, tagged: false };
  }
}

export function inferCategoryFromText(text: string): ProductCategory {
  const lower = text.toLowerCase();
  if (
    /\b(pantry|fridge|refrigerator|canister|food storage|cereal|pasta|produce|snack|freezer)\b/.test(
      lower
    )
  ) {
    return "pantry";
  }
  if (
    /\b(bathroom|vanity|shower|skincare|makeup|towel|toilet|sink caddy|soap|toothbrush)\b/.test(
      lower
    )
  ) {
    return "bathroom";
  }
  if (
    /\b(closet|drawer|laundry|under bed|hanger|shoe|cable|cord|desk|entryway|garage|linen)\b/.test(
      lower
    )
  ) {
    return "organization";
  }
  return "kitchen";
}

export function inferBadgeFromPrice(
  priceUsd?: number,
  text = ""
): PriceBadge {
  if (typeof priceUsd === "number" && Number.isFinite(priceUsd) && priceUsd > 0) {
    if (priceUsd <= 25) return "Under $25";
    if (priceUsd <= 50) return "Under $50";
  }
  const lower = text.toLowerCase();
  if (/\b(space|compact|stackable|slim|foldable|magnetic|pull-out)\b/.test(lower)) {
    return "Space Saver";
  }
  if (/\b(gift|set|bundle)\b/.test(lower)) {
    return "Gift Idea";
  }
  return "Best Seller";
}

export function generateSmartPitch(
  title: string,
  category: ProductCategory,
  highlights: string[]
): string {
  if (highlights.length > 0 && highlights[0].length >= 24) {
    const first = highlights[0].replace(/\.$/, "");
    const trimmed = first.length > 140 ? `${first.slice(0, 137).trimEnd()}...` : first;
    return `${trimmed} — a clean, practical upgrade curated for everyday clutter-free living.`;
  }

  const byCategory: Record<ProductCategory, string> = {
    kitchen:
      "Streamlines busy countertops and cabinets so everyday cooking feels calmer and faster.",
    pantry:
      "Brings instant visual order to fridge and pantry shelves while keeping staples easy to grab.",
    bathroom:
      "Clears bathroom counter clutter and keeps daily skincare and essentials neatly within reach.",
    organization:
      "A renter-friendly storage upgrade designed to turn crowded drawers and closets into calm spaces.",
  };
  return `${title.split(",")[0].trim()} — ${byCategory[category].charAt(0).toLowerCase()}${byCategory[category].slice(1)}`;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAmazonHtml(html: string): ParsedAmazonProduct {
  const blocked =
    /Enter the characters you see below|Robot Check|api-services-support@amazon\.com|validateCaptcha/i.test(
      html
    );

  if (blocked) {
    return { title: "", imageUrl: "", highlights: [], blocked: true };
  }

  // Title extraction
  let title = "";
  const titleIdMatch = /id="productTitle"[^>]*>([\s\S]*?)<\/span>/i.exec(html);
  if (titleIdMatch?.[1]) {
    title = decodeHtmlEntities(titleIdMatch[1].replace(/<[^>]+>/g, ""));
  }
  if (!title) {
    const ogTitle =
      /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i.exec(html) ||
      /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i.exec(html);
    if (ogTitle?.[1]) {
      title = decodeHtmlEntities(ogTitle[1]).replace(/^Amazon\.com\s*:\s*/i, "");
    }
  }
  if (!title) {
    const docTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (docTitle?.[1]) {
      title = decodeHtmlEntities(docTitle[1])
        .replace(/^Amazon\.com\s*:\s*/i, "")
        .replace(/\s*:\s*Home & Kitchen.*$/i, "")
        .trim();
    }
  }

  // High-res image extraction
  let imageUrl = "";
  const hiResMatch = /"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i.exec(
    html
  );
  const oldHiresMatch = /data-old-hires="(https:\/\/[^"]+)"/i.exec(html);
  const landingImgMatch = /id="landingImage"[^>]+src="(https:\/\/[^"]+)"/i.exec(
    html
  );
  const ogImageMatch =
    /<meta[^>]+property="og:image"[^>]+content="(https:\/\/[^"]+)"/i.exec(html);

  imageUrl =
    hiResMatch?.[1] ||
    oldHiresMatch?.[1] ||
    landingImgMatch?.[1] ||
    ogImageMatch?.[1] ||
    "";

  // Price extraction
  let priceUsd: number | undefined;
  const priceMatch =
    /"priceAmount"\s*:\s*([0-9]+(?:\.[0-9]{1,2})?)/i.exec(html) ||
    /class="a-offscreen"[^>]*>\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i.exec(html);
  if (priceMatch?.[1]) {
    const parsed = Number(priceMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      priceUsd = parsed;
    }
  }

  // Feature bullets extraction
  const highlights: string[] = [];
  const bulletsBlock = /id="feature-bullets"[\s\S]*?<\/ul>/i.exec(html);
  if (bulletsBlock?.[0]) {
    const liRegex = /<span class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi;
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(bulletsBlock[0])) !== null && highlights.length < 4) {
      const cleaned = decodeHtmlEntities(m[1].replace(/<[^>]+>/g, ""));
      if (
        cleaned.length >= 12 &&
        !/make sure this fits|entering your model number/i.test(cleaned)
      ) {
        highlights.push(
          cleaned.length > 150 ? `${cleaned.slice(0, 147).trimEnd()}...` : cleaned
        );
      }
    }
  }

  return {
    title,
    imageUrl,
    priceUsd,
    highlights,
    blocked: false,
  };
}
