import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "node:child_process";
import { isStudioEnabled } from "@/lib/studio-guard";
import { readSiteConfig } from "@/lib/storage";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

function runGit(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf-8",
    timeout: 30000,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;

  const config = readSiteConfig();
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  try {
    const statusRaw = runGit([
      "status",
      "--porcelain",
      "--",
      "data",
      "public/images/uploads",
    ]);
    const files = statusRaw
      ? statusRaw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
    const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
    return NextResponse.json({
      pendingCount: files.length,
      files,
      branch,
      baseUrl,
      rssUrl: `${baseUrl}/rss.xml`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Không kiểm tra được Git: ${err.message}`
            : "Không kiểm tra được trạng thái Git.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  let customMessage = "";
  try {
    const body = (await req.json()) as { message?: string };
    customMessage = (body.message ?? "").trim();
  } catch {
    // Empty body is fine
  }

  const config = readSiteConfig();
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  try {
    // Only stage content & uploaded images — never secrets
    runGit(["add", "--", "data", "public/images/uploads"]);
    const staged = runGit(["diff", "--cached", "--name-only"]);

    if (!staged) {
      return NextResponse.json({
        pushed: false,
        message: "Không có thay đổi dữ liệu mới nào cần xuất bản.",
        baseUrl,
        rssUrl: `${baseUrl}/rss.xml`,
      });
    }

    const commitMsg =
      customMessage ||
      `Update curated finds (${new Date().toISOString().slice(0, 16).replace("T", " ")})`;
    runGit(["commit", "-m", commitMsg]);
    const commitHash = runGit(["rev-parse", "--short", "HEAD"]);
    const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
    runGit(["push", "origin", branch]);

    return NextResponse.json({
      pushed: true,
      commitHash,
      branch,
      message: `Đã đẩy bản cập nhật (${commitHash}) lên GitHub! Vercel sẽ tự cập nhật web sau ~30 giây.`,
      baseUrl,
      rssUrl: `${baseUrl}/rss.xml`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Lỗi khi xuất bản lên GitHub: ${err.message}`
            : "Không thể push lên GitHub.",
      },
      { status: 500 }
    );
  }
}
