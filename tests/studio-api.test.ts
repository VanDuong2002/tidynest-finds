import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as getProducts,
  POST as postProduct,
} from "../src/app/api/studio/products/route";
import { GET as proxyImage } from "../src/app/api/studio/image-proxy/route";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
});

describe("studio API routes security & validation", () => {
  it("returns 404 for studio endpoints in production mode", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const prodRes = await getProducts();
    expect(prodRes.status).toBe(404);

    const proxyReq = new NextRequest(
      "http://localhost:3000/api/studio/image-proxy?url=https://example.com/a.png"
    );
    const proxyRes = await proxyImage(proxyReq);
    expect(proxyRes.status).toBe(404);
  });

  it("rejects non-http(s) URLs in image-proxy during development", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";

    const proxyReq = new NextRequest(
      "http://localhost:3000/api/studio/image-proxy?url=file:///C:/Windows/win.ini"
    );
    const res = await proxyImage(proxyReq);
    expect(res.status).toBe(400);
  });

  it("rejects invalid affiliate URLs when creating a product in development", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";

    const req = new NextRequest("http://localhost:3000/api/studio/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Test Organizer",
        category: "kitchen",
        badge: "Under $25",
        affiliateUrl: "javascript:alert(1)",
        imageUrl: "/images/samples/spice-rack.svg",
        shortPitch: "Short pitch",
        highlights: ["Good"],
      }),
    });
    const res = await postProduct(req);
    expect(res.status).toBe(400);
  });
});
