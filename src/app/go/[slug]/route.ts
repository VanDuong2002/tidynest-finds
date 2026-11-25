import { NextResponse } from "next/server";
import { isValidHttpUrl, readProducts } from "@/lib/storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const product = readProducts().find((p) => p.slug === slug);

  if (!product || !isValidHttpUrl(product.affiliateUrl)) {
    return NextResponse.json({ error: "Product link not found" }, { status: 404 });
  }

  return NextResponse.redirect(product.affiliateUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
