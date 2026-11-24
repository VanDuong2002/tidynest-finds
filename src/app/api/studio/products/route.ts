import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  ensureUniqueSlug,
  isSafeImageUrl,
  isValidHttpUrl,
  readCollections,
  readProducts,
  writeCollections,
  writeProducts,
} from "@/lib/storage";
import type { PriceBadge, Product, ProductCategory } from "@/lib/types";

const VALID_CATEGORIES = new Set<ProductCategory>([
  "kitchen",
  "pantry",
  "bathroom",
  "organization",
]);

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({ products: readProducts() });
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Product>;
  const title = (body.title ?? "").trim();
  const affiliateUrl = (body.affiliateUrl ?? "").trim();
  const imageUrl = (body.imageUrl ?? "").trim();
  const shortPitch = (body.shortPitch ?? "").trim();
  const category = (body.category ?? "kitchen") as ProductCategory;
  const badge = (body.badge ?? "Under $25") as PriceBadge;

  if (!title) {
    return NextResponse.json(
      { error: "Tên sản phẩm không được để trống." },
      { status: 400 }
    );
  }
  if (!isValidHttpUrl(affiliateUrl)) {
    return NextResponse.json(
      { error: "Link affiliate phải là đường dẫn http:// hoặc https:// hợp lệ." },
      { status: 400 }
    );
  }
  if (!isSafeImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Đường dẫn ảnh phải là /images/... hoặc link https:// hợp lệ." },
      { status: 400 }
    );
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "Danh mục không hợp lệ." },
      { status: 400 }
    );
  }

  const products = readProducts();
  const slug = ensureUniqueSlug(
    body.slug || title,
    products.map((p) => p.slug)
  );

  const highlights = Array.isArray(body.highlights)
    ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
    : [];

  const created: Product = {
    id: `prod-${crypto.randomBytes(4).toString("hex")}`,
    slug,
    title,
    category,
    badge,
    affiliateUrl,
    imageUrl: imageUrl || "/images/samples/spice-rack.svg",
    shortPitch:
      shortPitch || "A clever everyday home upgrade curated for clutter-free living.",
    highlights,
    featured: Boolean(body.featured),
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...products];
  writeProducts(next);
  return NextResponse.json({ product: created, products: next }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Product>;
  if (!body.id) {
    return NextResponse.json({ error: "Thiếu ID sản phẩm." }, { status: 400 });
  }
  if (body.affiliateUrl !== undefined && !isValidHttpUrl(body.affiliateUrl)) {
    return NextResponse.json(
      { error: "Link affiliate không hợp lệ." },
      { status: 400 }
    );
  }
  if (body.imageUrl !== undefined && !isSafeImageUrl(body.imageUrl)) {
    return NextResponse.json(
      { error: "Đường dẫn ảnh không hợp lệ." },
      { status: 400 }
    );
  }

  const products = readProducts();
  const idx = products.findIndex((p) => p.id === body.id);
  if (idx === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy sản phẩm." },
      { status: 404 }
    );
  }

  const existing = products[idx];
  const updated: Product = {
    ...existing,
    title: body.title?.trim() || existing.title,
    category:
      body.category && VALID_CATEGORIES.has(body.category)
        ? body.category
        : existing.category,
    badge: body.badge ?? existing.badge,
    affiliateUrl: body.affiliateUrl?.trim() || existing.affiliateUrl,
    imageUrl: body.imageUrl?.trim() || existing.imageUrl,
    shortPitch: body.shortPitch?.trim() ?? existing.shortPitch,
    highlights: Array.isArray(body.highlights)
      ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
      : existing.highlights,
    featured:
      typeof body.featured === "boolean" ? body.featured : existing.featured,
    isSample: false,
  };

  const next = [...products];
  next[idx] = updated;
  writeProducts(next);
  return NextResponse.json({ product: updated, products: next });
}

export async function DELETE(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const scope = searchParams.get("scope");

  const products = readProducts();
  let next: Product[];
  if (scope === "samples") {
    next = products.filter((p) => !p.isSample);
  } else if (id) {
    next = products.filter((p) => p.id !== id);
  } else {
    return NextResponse.json({ error: "Thiếu tham số xóa." }, { status: 400 });
  }

  writeProducts(next);

  const remainingIds = new Set(next.map((p) => p.id));
  const collections = readCollections();
  const prunedCollections = collections.map((c) => ({
    ...c,
    productIds: c.productIds.filter((pid) => remainingIds.has(pid)),
  }));
  writeCollections(prunedCollections);

  return NextResponse.json({ products: next, collections: prunedCollections });
}
