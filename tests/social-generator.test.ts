import { describe, expect, it } from "vitest";
import {
  generateCollectionSocialPack,
  generateProductSocialPack,
} from "@/lib/social-generator";
import type { Collection, Product } from "@/lib/types";

const SAMPLE_PRODUCT: Product = {
  id: "prod-test-1",
  slug: "cosori-6qt-air-fryer",
  title: "COSORI TurboBlaze 6-Qt Air Fryer",
  category: "kitchen",
  badge: "Best Seller",
  affiliateUrl: "https://www.amazon.com/dp/B0C33CHG99?tag=tidynestfi08f-20",
  imageUrl: "/images/uploads/test.jpg",
  shortPitch: "Cooks crispy meals faster with a ceramic nonstick basket.",
  highlights: ["4.8★ rated by 22,900+ buyers"],
  ratingLabel: "4.8★ · 22.9K+ Amazon reviews",
  featured: true,
  isSample: false,
  createdAt: "2026-11-26T00:00:00.000Z",
};

const SAMPLE_COLLECTION: Collection = {
  id: "col-test-1",
  slug: "kitchen-reset",
  title: "4 Amazon Kitchen Organizers",
  subtitle: "Quick small-space kitchen upgrades",
  coverImageUrl: "/images/uploads/test.jpg",
  productIds: ["prod-test-1"],
  intro: "Turn messy counters into calm spaces.",
  isSample: false,
  createdAt: "2026-11-26T00:00:00.000Z",
};

describe("social-generator", () => {
  it("generates complete 4-platform pack and 4 video scenes for a product", () => {
    const pack = generateProductSocialPack(
      SAMPLE_PRODUCT,
      "https://tidynest-finds-515f.vercel.app/",
      0
    );

    expect(pack.itemNumber).toBe("#01");
    expect(pack.linksBioUrl).toBe("https://tidynest-finds-515f.vercel.app/links");
    expect(pack.destinationUrl).toBe(
      "https://tidynest-finds-515f.vercel.app/finds/cosori-6qt-air-fryer"
    );
    expect(pack.scenes).toHaveLength(4);
    expect(pack.tiktok.caption).toContain("#01");
    expect(pack.tiktok.hashtags.length).toBeGreaterThanOrEqual(4);
    expect(pack.instagram.caption).toContain('Comment "LINK"');
    expect(pack.facebook.firstComment).toContain(pack.destinationUrl);
    expect(pack.youtubeShorts.title).toContain("#shorts");
    expect(pack.youtubeShorts.description).toContain(pack.destinationUrl);
  });

  it("generates complete 4-platform pack for a collection", () => {
    const pack = generateCollectionSocialPack(
      SAMPLE_COLLECTION,
      "https://tidynest-finds-515f.vercel.app"
    );

    expect(pack.scenes).toHaveLength(4);
    expect(pack.destinationUrl).toBe(
      "https://tidynest-finds-515f.vercel.app/collections/kitchen-reset"
    );
    expect(pack.facebook.firstComment).toContain(pack.destinationUrl);
  });
});
