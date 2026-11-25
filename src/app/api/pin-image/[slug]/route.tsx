import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { readProducts, readSiteConfig } from "@/lib/storage";
import { CATEGORY_LABELS } from "@/lib/types";

export const runtime = "nodejs";

function resolveImageSrc(imageUrl: string, baseUrl: string): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/images/")) {
    const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\/+/, ""));
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
        const mime =
          ext === ".png"
            ? "image/png"
            : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";
        const buf = fs.readFileSync(filePath);
        return `data:${mime};base64,${buf.toString("base64")}`;
      }
    }
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return `${cleanBase}${imageUrl}`;
  }
  return null;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const products = readProducts();
  const config = readSiteConfig();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return new Response("Not found", { status: 404 });
  }

  const imageSrc = resolveImageSrc(product.imageUrl, config.baseUrl);
  const categoryLabel = CATEGORY_LABELS[product.category] ?? "Home Finds";
  const hostLabel = config.baseUrl
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1000px",
          height: "1500px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F6F1E9",
          padding: "56px",
          color: "#181512",
          fontFamily: "Georgia, serif",
          justifyContent: "space-between",
        }}
      >
        {/* Top Masthead */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #181512",
            paddingBottom: "22px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "20px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#7A6A5C",
                fontFamily: "sans-serif",
                fontWeight: 700,
              }}
            >
              {categoryLabel}
            </span>
          </div>
          <div
            style={{
              backgroundColor: "#B84A27",
              color: "#FAF7F2",
              padding: "10px 24px",
              fontSize: "22px",
              fontFamily: "sans-serif",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {product.badge}
          </div>
        </div>

        {/* Product Image Frame */}
        <div
          style={{
            display: "flex",
            width: "888px",
            height: "820px",
            backgroundColor: "#FFFFFF",
            border: "2px solid #DDD2C3",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "32px",
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.title}
              style={{
                width: "888px",
                height: "820px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "36px",
                color: "#8A7D72",
                fontFamily: "sans-serif",
              }}
            >
              {config.siteName}
            </div>
          )}
        </div>

        {/* Editorial Headline & Pitch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "32px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                fontSize: "52px",
                lineHeight: 1.12,
                fontWeight: 700,
                color: "#181512",
                letterSpacing: "-0.02em",
              }}
            >
              {product.title.length > 68
                ? `${product.title.slice(0, 65)}...`
                : product.title}
            </div>
            <div
              style={{
                fontSize: "26px",
                lineHeight: 1.45,
                color: "#4E453D",
                fontFamily: "sans-serif",
              }}
            >
              {product.shortPitch.length > 130
                ? `${product.shortPitch.slice(0, 127)}...`
                : product.shortPitch}
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid #181512",
              paddingTop: "24px",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#181512",
                }}
              >
                {config.siteName}
              </span>
              <span
                style={{
                  fontSize: "18px",
                  color: "#6E6257",
                  fontFamily: "sans-serif",
                }}
              >
                {hostLabel}
              </span>
            </div>
            <div
              style={{
                backgroundColor: "#181512",
                color: "#FAF7F2",
                padding: "16px 32px",
                fontSize: "22px",
                fontFamily: "sans-serif",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Tap to Shop on Amazon →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
    }
  );
}
