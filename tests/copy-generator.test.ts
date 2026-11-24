import { describe, it, expect } from "vitest";
import {
  generateProductPinCopy,
  generateCollectionPinCopy,
} from "../src/lib/copy-generator";
import type { Collection, Product } from "../src/lib/types";

const sampleProduct: Product = {
  id: "prod-1",
  slug: "magnetic-fridge-spice-rack-set",
  title:
    "Magnetic Fridge Spice Rack Organizer Set of 4 Heavy Duty Space Saving Kitchen Storage",
  category: "kitchen",
  badge: "Under $25",
  affiliateUrl: "https://www.amazon.com/dp/SAMPLE001?tag=test-20",
  imageUrl: "/images/samples/spice-rack.svg",
  shortPitch: "Turns the side of your fridge into a clean spice station.",
  highlights: ["Strong magnets", "No drilling required"],
  featured: true,
  isSample: true,
  createdAt: "2026-11-24T00:00:00.000Z",
};

const sampleCollection: Collection = {
  id: "col-1",
  slug: "kitchen-organizers",
  title: "4 Amazon Kitchen Organizers That Instantly Clear Counter Clutter",
  subtitle: "Small-space kitchen upgrades.",
  coverImageUrl: "/images/samples/spice-rack.svg",
  productIds: ["prod-1"],
  intro: "Smart vertical storage ideas for busy kitchens.",
  isSample: true,
  createdAt: "2026-11-24T00:00:00.000Z",
};

describe("copy-generator", () => {
  it("generates 3 compliant US-English variations for a product", () => {
    const variations = generateProductPinCopy(sampleProduct);
    expect(variations).toHaveLength(3);
    for (const v of variations) {
      expect(v.title.length).toBeGreaterThan(10);
      expect(v.title.length).toBeLessThanOrEqual(100);
      expect(v.description.toLowerCase()).toContain("affiliate");
      expect(v.hashtags.length).toBeGreaterThanOrEqual(5);
      expect(v.hashtags.length).toBeLessThanOrEqual(8);
      expect(v.hashtags.every((h) => h.startsWith("#"))).toBe(true);
    }
  });

  it("generates 3 compliant listicle variations for a collection", () => {
    const variations = generateCollectionPinCopy(sampleCollection, [
      sampleProduct,
    ]);
    expect(variations).toHaveLength(3);
    for (const v of variations) {
      expect(v.title.length).toBeLessThanOrEqual(100);
      expect(v.description.toLowerCase()).toContain("affiliate");
      expect(v.hashtags.length).toBeGreaterThanOrEqual(5);
    }
  });
});
