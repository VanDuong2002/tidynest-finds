import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  ensureUniqueSlug,
  isSafeExternalHttpUrl,
  isSafeImageUrl,
  readProducts,
  readSiteConfig,
  writeProducts,
} from "@/lib/storage";
import {
  buildAffiliateUrl,
  generateSmartPitch,
  inferBadgeFromPrice,
  inferCategoryFromText,
  parseAmazonHtml,
} from "@/lib/amazon-utils";
import type { Product } from "@/lib/types";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function downloadImageLocally(
  remoteUrl: string,
  slugHint: string
): Promise<string> {
  if (!isSafeExternalHttpUrl(remoteUrl)) return remoteUrl;
  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return remoteUrl;
    const contentType = (res.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const ext = MIME_TO_EXT[contentType];
    if (!ext) return remoteUrl;

    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength === 0 || arrayBuf.byteLength > 8 * 1024 * 1024) {
      return remoteUrl;
    }

    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const safeSlug = slugHint.replace(/[^a-z0-9-]/gi, "").slice(0, 36) || "item";
    const filename = `${Date.now()}-${safeSlug}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(arrayBuf));
    return `/images/uploads/${filename}`;
  } catch {
    return remoteUrl;
  }
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as {
    input?: string;
    title?: string;
    imageUrl?: string;
    priceUsd?: number;
    highlights?: string[];
    autoSave?: boolean;
    downloadImage?: boolean;
  };

  const rawInput = (body.input ?? "").trim();
  if (!rawInput) {
    return NextResponse.json(
      { error: "Vui lòng dán link Amazon hoặc mã ASIN (ví dụ: B08XYZ1234)." },
      { status: 400 }
    );
  }

  const config = readSiteConfig();
  let resolvedUrl = rawInput;

  // If user pasted an amzn.to short link, resolve redirect once to extract canonical ASIN
  if (/^https?:\/\/(www\.)?amzn\.to\//i.test(rawInput) && isSafeExternalHttpUrl(rawInput)) {
    try {
      const res = await fetch(rawInput, {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.url && isSafeExternalHttpUrl(res.url)) {
        resolvedUrl = res.url;
      }
    } catch {
      // Keep original amzn.to URL if resolution fails
    }
  }

  const normalized = buildAffiliateUrl(resolvedUrl, config.amazonAssociateTag);

  let title = (body.title ?? "").trim();
  let imageUrl = (body.imageUrl ?? "").trim();
  let priceUsd =
    typeof body.priceUsd === "number" && Number.isFinite(body.priceUsd)
      ? body.priceUsd
      : undefined;
  let highlights = Array.isArray(body.highlights)
    ? body.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 5)
    : [];
  let amazonBlocked = false;

  // If metadata wasn't supplied by Bookmarklet, try fetching Amazon product page cleanly
  if (!title && isSafeExternalHttpUrl(normalized.url)) {
    try {
      const res = await fetch(normalized.url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "accept-language": "en-US,en;q=0.9",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) {
        const html = await res.text();
        const parsed = parseAmazonHtml(html);
        amazonBlocked = parsed.blocked;
        if (!parsed.blocked) {
          title = parsed.title || title;
          imageUrl = parsed.imageUrl || imageUrl;
          priceUsd = parsed.priceUsd ?? priceUsd;
          if (parsed.highlights.length > 0) {
            highlights = parsed.highlights;
          }
        }
      }
    } catch {
      // Network timeout or fetch failure; fall back to manual / bookmarklet
    }
  }

  const category = inferCategoryFromText(`${title} ${highlights.join(" ")}`);
  const badge = inferBadgeFromPrice(priceUsd, title);
  const shortPitch = title
    ? generateSmartPitch(title, category, highlights)
    : "";

  if (body.downloadImage !== false && imageUrl && isSafeExternalHttpUrl(imageUrl)) {
    imageUrl = await downloadImageLocally(imageUrl, normalized.asin || title || "find");
  }

  const draft = {
    title,
    category,
    badge,
    affiliateUrl: normalized.url,
    asin: normalized.asin,
    tagged: normalized.tagged,
    imageUrl: isSafeImageUrl(imageUrl) ? imageUrl : "",
    shortPitch,
    highlights,
    priceUsd,
    blocked: amazonBlocked,
  };

  if (body.autoSave && title) {
    const products = readProducts();
    const slug = ensureUniqueSlug(
      title,
      products.map((p) => p.slug)
    );
    const created: Product = {
      id: `prod-${crypto.randomBytes(4).toString("hex")}`,
      slug,
      title,
      category,
      badge,
      affiliateUrl: normalized.url,
      imageUrl: draft.imageUrl || "/images/samples/spice-rack.svg",
      shortPitch:
        shortPitch ||
        "A clever everyday home upgrade curated for clutter-free living.",
      highlights,
      featured: true,
      isSample: false,
      createdAt: new Date().toISOString(),
    };
    const next = [created, ...products];
    writeProducts(next);
    const cleanBase = config.baseUrl.replace(/\/+$/, "");
    return NextResponse.json({
      saved: true,
      product: created,
      products: next,
      draft,
      shortLink: `${cleanBase}/go/${created.slug}`,
      productUrl: `${cleanBase}/finds/${created.slug}`,
      pinImageUrl: `${cleanBase}/api/pin-image/${created.slug}`,
    });
  }

  return NextResponse.json({
    saved: false,
    draft,
    message: amazonBlocked
      ? "Amazon yêu cầu xác minh trình duyệt cho link này. Đã tự gắn Associate Tag chuẩn — hãy bấm nút Bookmarklet ngay trên tab Amazon để hút đủ tên + ảnh + mô tả trong 1 click!"
      : !title
        ? "Đã chuẩn hóa link affiliate Amazon. Chưa tự lấy được tên sản phẩm — bạn có thể điền nhanh hoặc dùng Bookmarklet 1-click."
        : "Đã tự động lấy thông tin sản phẩm, tải ảnh và gắn link affiliate!",
  });
}
