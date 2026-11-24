import { NextRequest, NextResponse } from "next/server";
import { isStudioEnabled } from "@/lib/studio-guard";
import { readSiteConfig, writeSiteConfig } from "@/lib/storage";
import type { SiteConfig } from "@/lib/types";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({ config: readSiteConfig() });
}

export async function PUT(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as Partial<SiteConfig>;
  const existing = readSiteConfig();
  const updated: SiteConfig = {
    siteName: body.siteName?.trim() || existing.siteName,
    tagline: body.tagline?.trim() || existing.tagline,
    disclosureText: body.disclosureText?.trim() || existing.disclosureText,
    pinterestUrl: body.pinterestUrl?.trim() ?? existing.pinterestUrl,
    gaMeasurementId: body.gaMeasurementId?.trim() ?? existing.gaMeasurementId,
    usdToVndRate:
      Number(body.usdToVndRate) > 0
        ? Math.round(Number(body.usdToVndRate))
        : existing.usdToVndRate,
    baseUrl:
      (body.baseUrl?.trim() || existing.baseUrl).replace(/\/+$/, ""),
  };

  writeSiteConfig(updated);
  return NextResponse.json({ config: updated });
}
