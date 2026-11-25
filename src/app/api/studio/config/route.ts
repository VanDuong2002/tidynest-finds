import { NextRequest, NextResponse } from "next/server";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  isValidGaMeasurementId,
  isValidHttpUrl,
  readSiteConfig,
  writeSiteConfig,
} from "@/lib/storage";
import { isValidAssociateTag } from "@/lib/amazon-utils";
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

  const nextGa = (body.gaMeasurementId ?? existing.gaMeasurementId).trim();
  if (!isValidGaMeasurementId(nextGa)) {
    return NextResponse.json(
      {
        error:
          "Mã Google Analytics 4 không hợp lệ (chỉ nhập mã dạng G-XXXXXXXXXX, không dán cả đoạn <script>).",
      },
      { status: 400 }
    );
  }

  const nextPinterest = (body.pinterestUrl ?? existing.pinterestUrl).trim();
  if (nextPinterest && !isValidHttpUrl(nextPinterest)) {
    return NextResponse.json(
      {
        error:
          "Link hồ sơ Pinterest phải bắt đầu bằng https:// hoặc http://.",
      },
      { status: 400 }
    );
  }

  const nextBaseUrl = (body.baseUrl ?? existing.baseUrl)
    .trim()
    .replace(/\/+$/, "");
  if (!isValidHttpUrl(nextBaseUrl)) {
    return NextResponse.json(
      {
        error:
          "Đường dẫn web công khai (Base URL) phải bắt đầu bằng https:// hoặc http:// (ví dụ: https://ten-web.vercel.app).",
      },
      { status: 400 }
    );
  }

  const nextAssociateTag = (
    body.amazonAssociateTag ??
    existing.amazonAssociateTag ??
    ""
  ).trim();
  if (!isValidAssociateTag(nextAssociateTag)) {
    return NextResponse.json(
      {
        error:
          "Amazon Associate Tag không hợp lệ (ví dụ hợp lệ: tidynest-20).",
      },
      { status: 400 }
    );
  }

  const updated: SiteConfig = {
    siteName: body.siteName?.trim() || existing.siteName,
    tagline: body.tagline?.trim() || existing.tagline,
    disclosureText: body.disclosureText?.trim() || existing.disclosureText,
    pinterestUrl: nextPinterest,
    gaMeasurementId: nextGa,
    usdToVndRate:
      Number(body.usdToVndRate) > 0
        ? Math.round(Number(body.usdToVndRate))
        : existing.usdToVndRate,
    baseUrl: nextBaseUrl,
    amazonAssociateTag: nextAssociateTag,
  };

  writeSiteConfig(updated);
  return NextResponse.json({ config: updated });
}
