import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isStudioEnabled } from "@/lib/studio-guard";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Chưa chọn file ảnh." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ảnh vượt quá giới hạn 5MB." },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".png";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ định dạng PNG, JPG, WEBP hoặc SVG." },
      { status: 400 }
    );
  }

  const safeBase = path
    .basename(file.name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "product";

  const filename = `${Date.now()}-${safeBase}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "images", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/images/uploads/${filename}` }, { status: 201 });
}
