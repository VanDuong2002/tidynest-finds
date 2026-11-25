import { describe, expect, it } from "vitest";
import {
  buildAffiliateUrl,
  extractAsin,
  generateSmartPitch,
  inferBadgeFromPrice,
  inferCategoryFromText,
  isValidAssociateTag,
  parseAmazonHtml,
} from "@/lib/amazon-utils";
import { GET as getRss } from "@/app/rss.xml/route";
import { GET as getGoRedirect } from "@/app/go/[slug]/route";

describe("amazon-utils", () => {
  it("extracts ASIN from dp URLs, gp/product URLs, and raw ASIN strings", () => {
    expect(
      extractAsin("https://www.amazon.com/Some-Product/dp/B08XYZ1234/ref=sr_1_1")
    ).toBe("B08XYZ1234");
    expect(
      extractAsin("https://www.amazon.com/gp/product/B09ABCDEF0?th=1")
    ).toBe("B09ABCDEF0");
    expect(extractAsin("b07qwert12")).toBe("B07QWERT12");
    expect(extractAsin("https://example.com/not-amazon")).toBeNull();
  });

  it("normalizes Amazon URL and attaches associate tag cleanly", () => {
    const res = buildAffiliateUrl(
      "https://www.amazon.com/Spice-Rack/dp/B08XYZ1234/ref=abc",
      "tidynest-20"
    );
    expect(res).toEqual({
      url: "https://www.amazon.com/dp/B08XYZ1234?tag=tidynest-20",
      asin: "B08XYZ1234",
      tagged: true,
    });
  });

  it("validates Amazon Associate tags", () => {
    expect(isValidAssociateTag("tidynest-20")).toBe(true);
    expect(isValidAssociateTag("")).toBe(true);
    expect(isValidAssociateTag("bad tag with spaces")).toBe(false);
  });

  it("infers category, badge, and smart pitch", () => {
    expect(inferCategoryFromText("Clear Stackable Fridge Pantry Bins")).toBe(
      "pantry"
    );
    expect(inferCategoryFromText("360 Rotating Bathroom Vanity Organizer")).toBe(
      "bathroom"
    );
    expect(inferBadgeFromPrice(19.99)).toBe("Under $25");
    expect(inferBadgeFromPrice(39.99)).toBe("Under $50");
    expect(inferBadgeFromPrice(undefined, "Compact Magnetic Rack")).toBe(
      "Space Saver"
    );
    expect(
      generateSmartPitch("Magnetic Spice Rack", "kitchen", [])
    ).toContain("Magnetic Spice Rack");
  });

  it("parses Amazon product HTML and detects bot check pages", () => {
    const html = `
      <html>
        <head><meta property="og:title" content="Amazon.com: Bamboo Drawer Organizer" /></head>
        <body>
          <span id="productTitle">  Bamboo Drawer Organizer (6-Pack)  </span>
          <img id="landingImage" data-old-hires="https://m.media-amazon.com/images/I/test.jpg" />
          <span class="a-offscreen">$22.99</span>
          <div id="feature-bullets"><ul>
            <li><span class="a-list-item">Spring-loaded dividers fit most kitchen drawers cleanly</span></li>
          </ul></div>
        </body>
      </html>
    `;
    const parsed = parseAmazonHtml(html);
    expect(parsed.blocked).toBe(false);
    expect(parsed.title).toBe("Bamboo Drawer Organizer (6-Pack)");
    expect(parsed.imageUrl).toBe("https://m.media-amazon.com/images/I/test.jpg");
    expect(parsed.priceUsd).toBe(22.99);
    expect(parsed.highlights[0]).toContain("Spring-loaded dividers");

    const captcha = parseAmazonHtml(
      "<html><body>Enter the characters you see below - Robot Check</body></html>"
    );
    expect(captcha.blocked).toBe(true);
  });
});

describe("Pinterest RSS & /go/[slug] routes", () => {
  it("generates valid Pinterest RSS 2.0 XML with media:content", async () => {
    const res = await getRss();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    const xml = await res.text();
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("<media:content");
    expect(xml).toContain("/api/pin-image/");
  });

  it("returns 404 for unknown slug on /go/[slug]", async () => {
    const res = await getGoRedirect(new Request("http://localhost:3000/go/nope"), {
      params: Promise.resolve({ slug: "non-existent-slug-xyz" }),
    });
    expect(res.status).toBe(404);
  });
});
