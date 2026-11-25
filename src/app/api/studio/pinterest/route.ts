import { NextRequest, NextResponse } from "next/server";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  readProducts,
  readSiteConfig,
  readStudioSecrets,
  writeStudioSecrets,
} from "@/lib/storage";
import { generateProductPinCopy } from "@/lib/copy-generator";

function guard() {
  if (!isStudioEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

function getPinterestApiBase(sandbox?: boolean): string {
  return sandbox
    ? "https://api-sandbox.pinterest.com/v5"
    : "https://api.pinterest.com/v5";
}

export async function GET(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const secrets = readStudioSecrets();
  const config = readSiteConfig();
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const { searchParams } = new URL(req.url);

  if (searchParams.get("action") === "boards") {
    if (!secrets.pinterestAccessToken) {
      return NextResponse.json(
        { error: "Chưa cấu hình Pinterest Access Token." },
        { status: 400 }
      );
    }
    try {
      const res = await fetch(
        `${getPinterestApiBase(secrets.pinterestSandbox)}/boards?page_size=25`,
        {
          headers: {
            Authorization: `Bearer ${secrets.pinterestAccessToken}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data?.message || "Không lấy được danh sách Board Pinterest." },
          { status: res.status }
        );
      }
      const boards = Array.isArray(data.items)
        ? data.items.map((b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          }))
        : [];
      return NextResponse.json({ boards });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Lỗi kết nối Pinterest API.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    hasToken: Boolean(secrets.pinterestAccessToken),
    boardId: secrets.pinterestBoardId,
    pinterestSandbox: Boolean(secrets.pinterestSandbox),
    rssUrl: `${baseUrl}/rss.xml`,
    baseUrl,
  });
}

export async function PUT(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json()) as {
    pinterestAccessToken?: string;
    pinterestBoardId?: string;
    pinterestSandbox?: boolean;
  };
  const existing = readStudioSecrets();

  const updated = {
    pinterestAccessToken:
      body.pinterestAccessToken !== undefined
        ? body.pinterestAccessToken.trim() || existing.pinterestAccessToken
        : existing.pinterestAccessToken,
    pinterestBoardId:
      body.pinterestBoardId !== undefined
        ? body.pinterestBoardId.trim()
        : existing.pinterestBoardId,
    pinterestSandbox:
      typeof body.pinterestSandbox === "boolean"
        ? body.pinterestSandbox
        : existing.pinterestSandbox,
  };

  writeStudioSecrets(updated);
  return NextResponse.json({
    saved: true,
    hasToken: Boolean(updated.pinterestAccessToken),
    boardId: updated.pinterestBoardId,
    pinterestSandbox: Boolean(updated.pinterestSandbox),
  });
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const secrets = readStudioSecrets();
  if (!secrets.pinterestAccessToken || !secrets.pinterestBoardId) {
    return NextResponse.json(
      {
        error:
          "Chưa kết nối Pinterest API Token hoặc chưa chọn Board ID. Bạn có thể dùng RSS Auto-Publish miễn phí hoặc điền Token trong tab Tự động hóa.",
      },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    productId?: string;
    angleIndex?: number;
  };
  const products = readProducts();
  const product = products.find((p) => p.id === body.productId);
  if (!product) {
    return NextResponse.json(
      { error: "Không tìm thấy sản phẩm để đăng Pin." },
      { status: 404 }
    );
  }

  const config = readSiteConfig();
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  if (/localhost|127\.0\.0\.1/i.test(baseUrl)) {
    return NextResponse.json(
      {
        error:
          "Base URL đang là localhost. Hãy cài Base URL công khai (Vercel) và bấm Xuất bản lên Web trước khi đăng Pin để Pinterest tải được ảnh.",
      },
      { status: 400 }
    );
  }

  const copies = generateProductPinCopy(product);
  const chosen = copies[body.angleIndex ?? 0] ?? copies[0];
  const pinImageUrl = `${baseUrl}/api/pin-image/${product.slug}`;
  const destinationLink = `${baseUrl}/finds/${product.slug}`;

  try {
    const res = await fetch(
      `${getPinterestApiBase(secrets.pinterestSandbox)}/pins`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secrets.pinterestAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board_id: secrets.pinterestBoardId,
          title: chosen.title.slice(0, 100),
          description: `${chosen.description} ${chosen.hashtags.join(" ")}`.slice(
            0,
            500
          ),
          link: destinationLink,
          alt_text: product.title.slice(0, 500),
          media_source: {
            source_type: "image_url",
            url: pinImageUrl,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            "Pinterest API từ chối đăng Pin. Kiểm tra lại Token và quyền pins:write.",
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      published: true,
      pinId: data.id,
      pinUrl: data.id ? `https://www.pinterest.com/pin/${data.id}/` : undefined,
      message: "Đã đăng Pin trực tiếp lên Pinterest thành công!",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Lỗi đăng Pin Pinterest: ${err.message}`
            : "Lỗi kết nối Pinterest API.",
      },
      { status: 500 }
    );
  }
}
