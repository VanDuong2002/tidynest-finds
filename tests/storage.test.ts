import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  slugify,
  ensureUniqueSlug,
  isValidHttpUrl,
  readProducts,
  writeProducts,
  readSiteConfig,
  writeSiteConfig,
} from "../src/lib/storage";
import { isStudioEnabled } from "../src/lib/studio-guard";
import type { Product, SiteConfig } from "../src/lib/types";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "home-finds-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("storage & studio-guard", () => {
  it("slugifies English and Vietnamese titles cleanly", () => {
    expect(slugify("Under-Sink 2-Tier Organizer! (Kitchen)")).toBe(
      "under-sink-2-tier-organizer-kitchen"
    );
    expect(slugify("Kệ gia vị 2 tầng")).toBe("ke-gia-vi-2-tang");
  });

  it("ensures unique slugs with numeric suffixes", () => {
    expect(ensureUniqueSlug("spice-rack", ["spice-rack", "spice-rack-2"])).toBe(
      "spice-rack-3"
    );
    expect(ensureUniqueSlug("new-item", ["spice-rack"])).toBe("new-item");
  });

  it("validates http and https URLs only", () => {
    expect(isValidHttpUrl("https://amzn.to/abc123")).toBe(true);
    expect(isValidHttpUrl("http://example.com/item")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("file:///C:/Windows/win.ini")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
  });

  it("round-trips products and site config on disk", () => {
    const dir = createTempDir();
    const sampleProduct: Product = {
      id: "prod-1",
      slug: "magnetic-spice-rack",
      title: "Magnetic Fridge Spice Rack",
      category: "kitchen",
      badge: "Under $25",
      affiliateUrl: "https://www.amazon.com/dp/SAMPLE001?tag=test-20",
      imageUrl: "/images/samples/spice-rack.svg",
      shortPitch: "Frees up counter space in seconds.",
      highlights: ["Strong magnets", "Matte finish"],
      featured: true,
      isSample: true,
      createdAt: "2026-11-24T00:00:00.000Z",
    };

    writeProducts([sampleProduct], dir);
    expect(readProducts(dir)).toEqual([sampleProduct]);

    const config: SiteConfig = {
      siteName: "TidyNest Finds",
      tagline: "Smart Home & Kitchen Finds",
      disclosureText: "As an Amazon Associate I earn from qualifying purchases.",
      pinterestUrl: "https://www.pinterest.com/tidynestfinds",
      gaMeasurementId: "",
      usdToVndRate: 25400,
      baseUrl: "http://localhost:3000",
    };
    writeSiteConfig(config, dir);
    expect(readSiteConfig(dir)).toEqual(config);
  });

  it("enables studio only in development mode", () => {
    expect(isStudioEnabled("development")).toBe(true);
    expect(isStudioEnabled("production")).toBe(false);
    expect(isStudioEnabled("test")).toBe(false);
  });
});
