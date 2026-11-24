import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { isStudioEnabled } from "@/lib/studio-guard";
import { readAnalytics, writeAnalytics } from "@/lib/storage";
import { parseAmazonAssociatesCsv } from "@/lib/analytics-utils";
import type { AnalyticsEntry } from "@/lib/types";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({ entries: readAnalytics() });
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as {
    mode?: "manual" | "csv";
    csvText?: string;
    entry?: Partial<AnalyticsEntry>;
  };

  const existing = readAnalytics();

  if (body.mode === "csv") {
    const parsed = parseAmazonAssociatesCsv(body.csvText ?? "");
    if (parsed.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không đọc được dòng dữ liệu hợp lệ nào từ file CSV. Hãy kiểm tra lại định dạng cột (Date, Product, Clicks, Ordered Items, Revenue, Fees).",
        },
        { status: 400 }
      );
    }
    const newEntries: AnalyticsEntry[] = parsed.map((row) => ({
      ...row,
      id: `ana-${crypto.randomBytes(4).toString("hex")}`,
    }));
    const next = [...newEntries, ...existing];
    writeAnalytics(next);
    return NextResponse.json(
      { importedCount: newEntries.length, entries: next },
      { status: 201 }
    );
  }

  const input = body.entry ?? {};
  const created: AnalyticsEntry = {
    id: `ana-${crypto.randomBytes(4).toString("hex")}`,
    date: (input.date ?? new Date().toISOString().slice(0, 10)).trim(),
    source: (input.source ?? "Pinterest").trim() || "Pinterest",
    productId: input.productId?.trim() || undefined,
    productName: input.productName?.trim() || "General / Site-wide",
    views: Math.max(0, Number(input.views) || 0),
    clicks: Math.max(0, Number(input.clicks) || 0),
    orders: Math.max(0, Number(input.orders) || 0),
    revenueUsd: Math.max(0, Number(input.revenueUsd) || 0),
    commissionUsd: Math.max(0, Number(input.commissionUsd) || 0),
    notes: input.notes?.trim() || undefined,
    isSample: false,
  };

  const next = [created, ...existing];
  writeAnalytics(next);
  return NextResponse.json({ entry: created, entries: next }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const scope = searchParams.get("scope");

  const existing = readAnalytics();
  let next: AnalyticsEntry[];
  if (scope === "samples") {
    next = existing.filter((e) => !e.isSample);
  } else if (id) {
    next = existing.filter((e) => e.id !== id);
  } else {
    return NextResponse.json({ error: "Thiếu tham số xóa." }, { status: 400 });
  }

  writeAnalytics(next);
  return NextResponse.json({ entries: next });
}
