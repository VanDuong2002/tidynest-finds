import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { readCollections, readProducts, readSiteConfig } from "@/lib/storage";

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
  const collections = readCollections();
  const products = readProducts();
  const config = readSiteConfig();
  const collection = collections.find((c) => c.slug === slug);

  if (!collection) {
    return new Response("Not found", { status: 404 });
  }

  const matchedProducts = collection.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const thumbs = matchedProducts.map((p) =>
    resolveImageSrc(p.imageUrl, config.baseUrl)
  );
  while (thumbs.length < 4) {
    thumbs.push(resolveImageSrc(collection.coverImageUrl, config.baseUrl));
  }

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
          padding: "52px",
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
            paddingBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#7A6A5C",
              fontFamily: "sans-serif",
              fontWeight: 700,
            }}
          >
            CURATED AMAZON GUIDE
          </span>
          <div
            style={{
              display: "flex",
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
            {`${collection.productIds.length} TOP FINDS`}
          </div>
        </div>

        {/* High-CTR 2x2 Product Collage Grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "896px",
            height: "840px",
            justifyContent: "space-between",
            alignContent: "space-between",
            marginTop: "28px",
          }}
        >
          {thumbs.slice(0, 4).map((src, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                width: "438px",
                height: "410px",
                backgroundColor: "#FFFFFF",
                border: "2px solid #DDD2C3",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {src ? (
                <img
                  src={src}
                  alt={`Find ${idx + 1}`}
                  style={{
                    width: "438px",
                    height: "410px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ fontSize: "28px", color: "#8A7D72" }}>
                  {config.siteName}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editorial Headline & CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "28px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                fontSize: "48px",
                lineHeight: 1.12,
                fontWeight: 700,
                color: "#181512",
                letterSpacing: "-0.02em",
              }}
            >
              {collection.title.length > 74
                ? `${collection.title.slice(0, 71)}...`
                : collection.title}
            </div>
            <div
              style={{
                fontSize: "24px",
                lineHeight: 1.4,
                color: "#4E453D",
                fontFamily: "sans-serif",
              }}
            >
              {collection.subtitle.length > 120
                ? `${collection.subtitle.slice(0, 117)}...`
                : collection.subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid #181512",
              paddingTop: "22px",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, color: "#181512" }}>
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
                display: "flex",
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
              {`See All ${collection.productIds.length} Amazon Finds →`}
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
