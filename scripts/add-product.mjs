import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const WORKSPACE = process.cwd();
const PRODUCTS_PATH = path.join(WORKSPACE, "data", "products.json");
const CONFIG_PATH = path.join(WORKSPACE, "data", "site-config.json");
const UPLOAD_DIR = path.join(WORKSPACE, "public", "images", "uploads");

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function downloadImage(imageUrl, asin) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const hdUrl = imageUrl.replace(/\._AC_UL\d+_\./i, "._AC_SL1500_.");
  const candidates = hdUrl !== imageUrl ? [hdUrl, imageUrl] : [imageUrl];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 2000) continue;
      const filename = `${Date.now()}-${asin}.jpg`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
      return `/images/uploads/${filename}`;
    } catch {
      // Try next candidate
    }
  }
  return imageUrl;
}

async function main() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    console.error("Usage: node scripts/add-product.mjs '<json>' | <path-to-json>");
    process.exit(1);
  }

  const input = fs.existsSync(rawArg)
    ? JSON.parse(fs.readFileSync(rawArg, "utf-8"))
    : JSON.parse(rawArg);

  const asin = String(input.asin || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    console.error(`Invalid ASIN: ${asin}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const associateTag = (config.amazonAssociateTag || "tidynestfi08f-20").trim();
  const existing = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf-8"));

  const duplicate = existing.find((p) =>
    String(p.affiliateUrl || "").toUpperCase().includes(`/DP/${asin}`)
  );
  if (duplicate) {
    console.log(JSON.stringify({ skipped: true, reason: "duplicate_asin", slug: duplicate.slug }));
    return;
  }

  const existingSlugs = new Set(existing.map((p) => p.slug));
  let slug = slugify(input.title || asin);
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${slugify(input.title || asin)}-${suffix++}`;
  }

  const localImage = await downloadImage(String(input.imageUrl || ""), asin);
  const created = {
    id: `prod-${crypto.randomBytes(4).toString("hex")}`,
    slug,
    title: String(input.title).trim(),
    category: input.category || "kitchen",
    badge: input.badge || "Under $25",
    affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(associateTag)}`,
    imageUrl: localImage,
    shortPitch: String(input.shortPitch || "").trim(),
    highlights: Array.isArray(input.highlights) ? input.highlights : [],
    featured: input.featured !== false,
    isSample: false,
    ...(input.ratingLabel ? { ratingLabel: String(input.ratingLabel).trim() } : {}),
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...existing];
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(next, null, 2) + "\n", "utf-8");
  console.log(JSON.stringify({ added: true, product: created, total: next.length }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
