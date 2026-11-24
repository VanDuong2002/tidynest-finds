import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { parseAmazonAssociatesCsv } from "../src/lib/analytics-utils";
import { PUT as putConfig } from "../src/app/api/studio/config/route";
import { GET as proxyImage } from "../src/app/api/studio/image-proxy/route";
import { POST as postProduct } from "../src/app/api/studio/products/route";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
});

describe("review fixes (Critical #1 - Important #5)", () => {
  it("#1 rejects malicious or malformed GA4 Measurement IDs in config API", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const req = new NextRequest("http://localhost:3000/api/studio/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gaMeasurementId: "G-1234'); alert(1); //",
      }),
    });
    const res = await putConfig(req);
    expect(res.status).toBe(400);
  });

  it("#2 blocks SSRF private/loopback URLs in image-proxy", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    for (const bad of [
      "http://127.0.0.1:3000/secret",
      "http://localhost:3000/api/studio/config",
      "http://169.254.169.254/latest/meta-data/",
      "http://192.168.1.1/admin",
    ]) {
      const req = new NextRequest(
        `http://localhost:3000/api/studio/image-proxy?url=${encodeURIComponent(bad)}`
      );
      const res = await proxyImage(req);
      expect(res.status).toBe(400);
    }
  });

  it("#3 rejects unsafe pinterestUrl, baseUrl, and imageUrl", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    const badConfigReq = new NextRequest("http://localhost:3000/api/studio/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pinterestUrl: "javascript:alert(1)",
        baseUrl: "mysite.vercel.app",
      }),
    });
    expect((await putConfig(badConfigReq)).status).toBe(400);

    const badImgReq = new NextRequest("http://localhost:3000/api/studio/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Test Item",
        category: "kitchen",
        badge: "Under $25",
        affiliateUrl: "https://amzn.to/abc",
        imageUrl: "javascript:alert(1)",
      }),
    });
    expect((await postProduct(badImgReq)).status).toBe(400);
  });

  it("#4 skips Total summary rows, preserves local MM/DD/YYYY dates, and prioritizes exact Amazon columns", () => {
    const csv = `Date,Link Name,Product Name,Clicks,Ordered Product Sales,Ordered Items,Shipped Revenue,Advertising Fees
11/21/2026,my-pin-1,"Spice Rack",20,$50.00,2,$50.00,$2.00
Total,,,20,$50.00,2,$50.00,$2.00
`;
    const rows = parseAmazonAssociatesCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe("2026-11-21");
    expect(rows[0].productName).toBe("Spice Rack");
    expect(rows[0].orders).toBe(2);
    expect(rows[0].commissionUsd).toBe(2);
  });
});
