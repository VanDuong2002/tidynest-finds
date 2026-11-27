import { readCollections, readProducts, readSiteConfig } from "@/lib/storage";
import {
  generateCollectionPinCopy,
  generateProductPinCopy,
} from "@/lib/copy-generator";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const config = readSiteConfig();
  const allProducts = readProducts();
  const realProducts = allProducts.filter((p) => !p.isSample);
  const products = realProducts.length > 0 ? realProducts : allProducts;

  const allCollections = readCollections();
  const realCollections = allCollections.filter((c) => !c.isSample);
  const collections =
    realCollections.length > 0 ? realCollections : allCollections;

  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const collectionItemsXml = collections.map((collection) => {
    const matchedProducts = collection.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const copies = generateCollectionPinCopy(collection, matchedProducts);
    const best = copies[0];
    const itemLink = `${baseUrl}/collections/${collection.slug}`;
    const pinImageUrl = `${baseUrl}/api/pin-image/collection/${collection.slug}`;
    const pubDate = new Date(collection.createdAt || Date.now()).toUTCString();
    const description = `${best.description} ${best.hashtags.join(" ")}`.trim();

    return `    <item>
      <title>${escapeXml(best.title)}</title>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
      <enclosure url="${escapeXml(pinImageUrl)}" type="image/png" length="0" />
      <media:content url="${escapeXml(pinImageUrl)}" medium="image" type="image/png" width="1000" height="1500" />
    </item>`;
  });

  const productItemsXml = products.map((product) => {
    const copies = generateProductPinCopy(product);
    const best = copies[0];
    const itemLink = `${baseUrl}/finds/${product.slug}`;
    const pinImageUrl = `${baseUrl}/api/pin-image/${product.slug}`;
    const pubDate = new Date(product.createdAt || Date.now()).toUTCString();
    const description = `${best.description} ${best.hashtags.join(" ")}`.trim();

    return `    <item>
      <title>${escapeXml(best.title)}</title>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
      <enclosure url="${escapeXml(pinImageUrl)}" type="image/png" length="0" />
      <media:content url="${escapeXml(pinImageUrl)}" medium="image" type="image/png" width="1000" height="1500" />
    </item>`;
  });

  const itemsXml = [...collectionItemsXml, ...productItemsXml].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(config.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
