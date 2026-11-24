import type {
  Collection,
  PinterestCopyVariation,
  Product,
  ProductCategory,
} from "./types";
import { CATEGORY_LABELS } from "./types";

const CATEGORY_HASHTAGS: Record<ProductCategory, string[]> = {
  kitchen: [
    "#AmazonKitchenFinds",
    "#KitchenOrganization",
    "#SmallKitchenIdeas",
    "#AmazonHomeFinds",
    "#KitchenHacks",
    "#HomeOrganization",
  ],
  pantry: [
    "#PantryOrganization",
    "#FridgeRestock",
    "#AmazonPantryFinds",
    "#KitchenStorage",
    "#OrganizedHome",
    "#AmazonHomeFinds",
  ],
  bathroom: [
    "#BathroomOrganization",
    "#VanitySetup",
    "#AmazonBathroomFinds",
    "#SmallBathroomIdeas",
    "#CleanHomeAesthetic",
    "#AmazonHomeFinds",
  ],
  organization: [
    "#HomeOrganization",
    "#DeclutterYourHome",
    "#AmazonHomeFinds",
    "#StorageIdeas",
    "#CozyHomeFinds",
    "#RenterFriendly",
  ],
};

function clampTitle(raw: string, maxLen = 100): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trimEnd() + "…";
}

function shortProductName(title: string, maxLen = 58): string {
  const clean = title.trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, "").trim();
}

export function generateProductPinCopy(
  product: Product
): PinterestCopyVariation[] {
  const shortName = shortProductName(product.title);
  const categoryLabel = CATEGORY_LABELS[product.category];
  const baseTags = CATEGORY_HASHTAGS[product.category];
  const highlightText =
    product.highlights.length > 0
      ? product.highlights.slice(0, 2).join(" • ")
      : "Easy to set up and built for everyday clutter control";

  return [
    {
      angle: "Góc độ 1: Giải quyết vấn đề (Problem-Solution)",
      title: clampTitle(
        `Tired of Clutter? Try This ${shortName} (${product.badge})`
      ),
      description: `${product.shortPitch} Why shoppers love it: ${highlightText}. Tap through to see full details and check the latest price on Amazon. (Affiliate link — we may earn a small commission at no extra cost to you.)`,
      hashtags: [...baseTags.slice(0, 5), "#AmazonMustHaves"],
    },
    {
      angle: "Góc độ 2: Thẩm mỹ & Đáng mua (Aesthetic Must-Have)",
      title: clampTitle(
        `Amazon ${categoryLabel} Find: ${shortName} You'll Use Daily`
      ),
      description: `Instant home upgrade alert! This ${product.title} makes organizing effortless while keeping your space calm and aesthetic. ${highlightText}. Save this Pin for your next home reset or tap to shop on Amazon. (Affiliate link)`,
      hashtags: [...baseTags.slice(0, 5), "#HomeReset"],
    },
    {
      angle: "Góc độ 3: Tiết kiệm & Quà tặng (Budget-Smart / Gift)",
      title: clampTitle(
        `Smart ${product.badge} Amazon Find: ${shortName}`
      ),
      description: `Looking for a practical ${categoryLabel.toLowerCase()} upgrade or thoughtful housewarming gift? ${product.shortPitch} Click through to view our quick review and check current availability on Amazon. (Affiliate link)`,
      hashtags: [...baseTags.slice(0, 5), "#HousewarmingGift"],
    },
  ];
}

export function generateCollectionPinCopy(
  collection: Collection,
  products: Product[]
): PinterestCopyVariation[] {
  const itemCount = collection.productIds.length || products.length || 4;
  const firstNames = products
    .slice(0, 3)
    .map((p) => shortProductName(p.title, 30))
    .join(", ");
  const previewSnippet = firstNames
    ? `Includes favorites like ${firstNames}.`
    : "Hand-picked Amazon favorites for a calmer, more organized home.";

  return [
    {
      angle: "Góc độ 1: Danh sách Top (Listicle Viral)",
      title: clampTitle(collection.title),
      description: `${collection.subtitle} ${previewSnippet} Tap to browse all ${itemCount} picks and check the latest prices on Amazon. (Contains affiliate links)`,
      hashtags: [
        "#AmazonHomeFinds",
        "#KitchenOrganization",
        "#HomeOrganizationIdeas",
        "#AmazonMustHaves",
        "#SmallSpaceStorage",
        "#HomeReset",
      ],
    },
    {
      angle: "Góc độ 2: Lưu lại dùng sau (Save-Worthy Reset)",
      title: clampTitle(
        `${itemCount} Clever Amazon Home Finds Worth Saving for Your Next Reset`
      ),
      description: `${collection.intro} Save this Pin for weekend organizing inspiration, then click through to see every pick in our curated guide. (Contains Amazon affiliate links)`,
      hashtags: [
        "#OrganizedHome",
        "#AmazonFinds",
        "#KitchenHacks",
        "#DeclutterYourHome",
        "#RenterFriendly",
        "#CozyHomeFinds",
      ],
    },
    {
      angle: "Góc độ 3: Gọn nhà trong 5 phút (Quick Upgrade)",
      title: clampTitle(
        `5-Minute Home Upgrades: ${collection.title}`
      ),
      description: `Small upgrades make the biggest difference in daily routines. ${previewSnippet} Tap the link to explore all ${itemCount} curated Amazon picks. (Affiliate links included)`,
      hashtags: [
        "#HomeUpgrades",
        "#AmazonKitchenFinds",
        "#PantryOrganization",
        "#SmartHomeFinds",
        "#TidyHome",
        "#BudgetHomeDecor",
      ],
    },
  ];
}
