import { NextRequest, NextResponse } from "next/server";
import { isStudioEnabled } from "@/lib/studio-guard";
import { isSafeExternalHttpUrl } from "@/lib/storage";

const ALLOWED_RASTER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_PROXY_BYTES = 5 * 1024 * 1024;

export async function GET(req: NextRequest) {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targetUrl = req.nextUrl.searchParams.get("url") ?? "";
  if (!isSafeExternalHttpUrl(targetUrl)) {
    return NextResponse.json(
      {
        error:
          "URL ảnh không hợp lệ (chỉ hỗ trợ link http/https công khai, không hỗ trợ mạng nội bộ).",
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(targetUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Không tải được ảnh từ nguồn ngoài." },
        { status: 502 }
      );
    }

    const rawType = (upstream.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_RASTER_TYPES.has(rawType)) {
      return NextResponse.json(
        { error: "Nguồn trả về không phải ảnh PNG/JPG/WEBP hợp lệ." },
        { status: 400 }
      );
    }

    const contentLength = Number(upstream.headers.get("content-length") ?? "0");
    if (contentLength > MAX_PROXY_BYTES) {
      return NextResponse.json(
        { error: "Ảnh nguồn vượt quá giới hạn 5MB." },
        { status: 413 }
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PROXY_BYTES) {
      return NextResponse.json(
        { error: "Ảnh nguồn vượt quá giới hạn 5MB." },
        { status: 413 }
      );
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": rawType,
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi kết nối hoặc hết thời gian tải ảnh." },
      { status: 502 }
    );
  }
}
