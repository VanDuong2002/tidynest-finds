import { NextRequest, NextResponse } from "next/server";
import { isStudioEnabled } from "@/lib/studio-guard";
import { isValidHttpUrl } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targetUrl = req.nextUrl.searchParams.get("url") ?? "";
  if (!isValidHttpUrl(targetUrl)) {
    return NextResponse.json(
      { error: "URL ảnh không hợp lệ (chỉ hỗ trợ http/https)." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(targetUrl);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Không tải được ảnh từ nguồn ngoài." },
        { status: 502 }
      );
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Đường dẫn không phải file ảnh." },
        { status: 400 }
      );
    }
    const arrayBuffer = await upstream.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi kết nối khi tải ảnh." },
      { status: 502 }
    );
  }
}
