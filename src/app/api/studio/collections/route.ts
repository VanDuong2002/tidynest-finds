import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  ensureUniqueSlug,
  readCollections,
  writeCollections,
} from "@/lib/storage";
import type { Collection } from "@/lib/types";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({ collections: readCollections() });
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Collection>;
  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { error: "Tiêu đề bộ sưu tập không được để trống." },
      { status: 400 }
    );
  }

  const collections = readCollections();
  const slug = ensureUniqueSlug(
    body.slug || title,
    collections.map((c) => c.slug)
  );

  const created: Collection = {
    id: `col-${crypto.randomBytes(4).toString("hex")}`,
    slug,
    title,
    subtitle:
      (body.subtitle ?? "").trim() ||
      "Curated Amazon home finds worth saving.",
    coverImageUrl:
      (body.coverImageUrl ?? "").trim() || "/images/samples/spice-rack.svg",
    productIds: Array.isArray(body.productIds)
      ? body.productIds.map(String)
      : [],
    intro:
      (body.intro ?? "").trim() ||
      "Hand-picked, practical organizers designed to make everyday home routines smoother.",
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...collections];
  writeCollections(next);
  return NextResponse.json(
    { collection: created, collections: next },
    { status: 201 }
  );
}

export async function PUT(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<Collection>;
  if (!body.id) {
    return NextResponse.json(
      { error: "Thiếu ID bộ sưu tập." },
      { status: 400 }
    );
  }

  const collections = readCollections();
  const idx = collections.findIndex((c) => c.id === body.id);
  if (idx === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy bộ sưu tập." },
      { status: 404 }
    );
  }

  const existing = collections[idx];
  const updated: Collection = {
    ...existing,
    title: body.title?.trim() || existing.title,
    subtitle: body.subtitle?.trim() ?? existing.subtitle,
    coverImageUrl: body.coverImageUrl?.trim() || existing.coverImageUrl,
    productIds: Array.isArray(body.productIds)
      ? body.productIds.map(String)
      : existing.productIds,
    intro: body.intro?.trim() ?? existing.intro,
    isSample: false,
  };

  const next = [...collections];
  next[idx] = updated;
  writeCollections(next);
  return NextResponse.json({ collection: updated, collections: next });
}

export async function DELETE(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const scope = searchParams.get("scope");

  const collections = readCollections();
  let next: Collection[];
  if (scope === "samples") {
    next = collections.filter((c) => !c.isSample);
  } else if (id) {
    next = collections.filter((c) => c.id !== id);
  } else {
    return NextResponse.json({ error: "Thiếu tham số xóa." }, { status: 400 });
  }

  writeCollections(next);
  return NextResponse.json({ collections: next });
}
