import type { Collection, Product, ProductCategory } from "./types";
import { CATEGORY_LABELS } from "./types";

export interface VideoScene {
  label: string;
  durationSec: number;
  headline: string;
  subline: string;
  badgeText?: string;
}

export interface MultiChannelContentPack {
  targetTitle: string;
  itemNumber: string;
  linksBioUrl: string;
  destinationUrl: string;
  voiceoverScript: string;
  scenes: VideoScene[];
  tiktok: {
    caption: string;
    hashtags: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
  facebook: {
    postText: string;
    firstComment: string;
  };
  youtubeShorts: {
    title: string;
    description: string;
  };
}

const CATEGORY_HASHTAGS: Record<ProductCategory, string[]> = {
  kitchen: ["#amazonkitchenfinds", "#kitchenorganization", "#kitchenhacks"],
  pantry: ["#pantryorganization", "#fridgereset", "#sundayreset"],
  bathroom: ["#bathroomorganization", "#bathroomfinds", "#renterfriendly"],
  organization: ["#homeorganization", "#smallspaceliving", "#declutteryourhome"],
};

const CATEGORY_HOOKS: Record<ProductCategory, string> = {
  kitchen: "Stop scrolling if your kitchen counters are always cluttered",
  pantry: "The Sunday fridge & pantry reset upgrade everyone is saving",
  bathroom: "Renter-friendly bathroom upgrade that looks like a 5-star spa",
  organization: "This Amazon home find fixes messy spaces in 60 seconds",
};

function shortTitle(title: string, maxLen = 58): string {
  const clean = title.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3).trimEnd()}...`;
}

export function generateProductSocialPack(
  product: Product,
  baseUrl: string,
  itemIndex: number
): MultiChannelContentPack {
  const cleanBase = (baseUrl || "https://tidynest-finds-515f.vercel.app").replace(
    /\/+$/,
    ""
  );
  const itemNumber = `#${String(itemIndex + 1).padStart(2, "0")}`;
  const linksBioUrl = `${cleanBase}/links`;
  const destinationUrl = `${cleanBase}/finds/${product.slug}`;
  const catTags = CATEGORY_HASHTAGS[product.category] ?? CATEGORY_HASHTAGS.kitchen;
  const hook = CATEGORY_HOOKS[product.category] ?? CATEGORY_HOOKS.kitchen;
  const proof = product.ratingLabel || `${product.badge} on Amazon US`;
  const topHighlight =
    product.highlights[0] ||
    "Smart, clutter-free upgrade designed for busy everyday homes.";

  const scenes: VideoScene[] = [
    {
      label: "0–3s · Hook",
      durationSec: 3,
      headline: hook,
      subline: `Amazon Find ${itemNumber} · ${product.badge}`,
      badgeText: `FIND ${itemNumber}`,
    },
    {
      label: "3–6s · Product Reveal",
      durationSec: 3,
      headline: shortTitle(product.title, 54),
      subline: shortTitle(product.shortPitch, 96),
      badgeText: CATEGORY_LABELS[product.category],
    },
    {
      label: "6–9s · Why It's Viral",
      durationSec: 3,
      headline: proof,
      subline: shortTitle(topHighlight, 96),
      badgeText: product.badge,
    },
    {
      label: "9–12s · Call To Action",
      durationSec: 3,
      headline: `Grab Find ${itemNumber} via Link in Bio`,
      subline: cleanBase.replace(/^https?:\/\//i, "") + "/links",
      badgeText: "TAP LINK IN BIO →",
    },
  ];

  const voiceoverScript = [
    `[0-3s] ${hook}.`,
    `[3-6s] Meet Find ${itemNumber}: ${shortTitle(product.title, 64)}. ${product.shortPitch}`,
    `[6-9s] Shoppers are obsessed — ${proof}. ${topHighlight}.`,
    `[9-12s] Tap the link in my bio and search ${itemNumber} to check today's price on Amazon!`,
  ].join("\n");

  const tiktokHashtags = [
    "#amazonfinds",
    "#amazonmusthaves",
    "#tiktokmademebuyit",
    ...catTags.slice(0, 2),
  ];

  const igHashtags = [
    "#amazonhomefinds",
    "#amazonfinds",
    "#homeupgrades",
    ...catTags,
  ];

  return {
    targetTitle: product.title,
    itemNumber,
    linksBioUrl,
    destinationUrl,
    voiceoverScript,
    scenes,
    tiktok: {
      caption: `${hook} 👀✨ Find ${itemNumber}: ${shortTitle(product.title, 65)} (${proof}). Link in bio → search ${itemNumber}!`,
      hashtags: tiktokHashtags,
    },
    instagram: {
      caption: `${hook} ✨\n\nThis is Find ${itemNumber}: ${product.title}\n• ${proof}\n• ${topHighlight}\n\n💬 Comment "LINK" below or tap the link in bio (${cleanBase.replace(/^https?:\/\//i, "")}/links) and search ${itemNumber}!`,
      hashtags: igHashtags,
    },
    facebook: {
      postText: `One of the smartest Amazon US upgrades we found this week (${proof}) 👇\n\n${product.title}\n${product.shortPitch}\n\nLink is pinned in the first comment so you can check live Amazon availability!`,
      firstComment: `Shop Find ${itemNumber} on Amazon here 👉 ${destinationUrl}\n(Full curated list: ${linksBioUrl})`,
    },
    youtubeShorts: {
      title: `${shortTitle(product.title, 62)} | Amazon Find ${itemNumber} #shorts`,
      description: `${product.shortPitch}\n\n✅ ${proof}\n🔗 Shop Find ${itemNumber}: ${destinationUrl}\n🏠 Browse all curated Amazon finds: ${linksBioUrl}\n\n#shorts #amazonfinds #homeorganization ${catTags.join(" ")}`,
    },
  };
}

export function generateCollectionSocialPack(
  collection: Collection,
  baseUrl: string
): MultiChannelContentPack {
  const cleanBase = (baseUrl || "https://tidynest-finds-515f.vercel.app").replace(
    /\/+$/,
    ""
  );
  const linksBioUrl = `${cleanBase}/links`;
  const destinationUrl = `${cleanBase}/collections/${collection.slug}`;
  const itemNumber = "GUIDE";

  const scenes: VideoScene[] = [
    {
      label: "0–3s · Hook",
      durationSec: 3,
      headline: shortTitle(collection.title, 56),
      subline: "Save this Amazon home reset list before it sells out",
      badgeText: "CURATED GUIDE",
    },
    {
      label: "3–6s · The Upgrade",
      durationSec: 3,
      headline: `${collection.productIds.length} Renter-Friendly Finds`,
      subline: shortTitle(collection.subtitle, 92),
      badgeText: "AMAZON US",
    },
    {
      label: "6–9s · Why It Works",
      durationSec: 3,
      headline: "Instant Clutter-Free Reset",
      subline: shortTitle(collection.intro, 96),
      badgeText: "4.5★+ RATED",
    },
    {
      label: "9–12s · Call To Action",
      durationSec: 3,
      headline: "Shop the Full List in Bio",
      subline: cleanBase.replace(/^https?:\/\//i, "") + "/links",
      badgeText: "TAP LINK IN BIO →",
    },
  ];

  const voiceoverScript = [
    `[0-3s] ${collection.title}.`,
    `[3-6s] ${collection.subtitle}`,
    `[6-9s] ${collection.intro}`,
    `[9-12s] All ${collection.productIds.length} Amazon links are waiting at the link in my bio — save this video so you don't lose it!`,
  ].join("\n");

  return {
    targetTitle: collection.title,
    itemNumber,
    linksBioUrl,
    destinationUrl,
    voiceoverScript,
    scenes,
    tiktok: {
      caption: `${collection.title} ✨ Save this list for your next weekend reset! All ${collection.productIds.length} Amazon links are in my bio.`,
      hashtags: [
        "#amazonfinds",
        "#homeorganization",
        "#kitchenfinds",
        "#sundayreset",
        "#amazonmusthaves",
      ],
    },
    instagram: {
      caption: `${collection.title} ✨\n\n${collection.subtitle}\n\n💬 Comment "LIST" or tap the link in bio to shop all ${collection.productIds.length} Amazon finds!`,
      hashtags: [
        "#amazonhomefinds",
        "#homeorganization",
        "#kitchenorganization",
        "#renterfriendly",
        "#cleanhome",
      ],
    },
    facebook: {
      postText: `${collection.title} 👇\n\n${collection.intro}\n\nAll ${collection.productIds.length} Amazon links are in the first comment!`,
      firstComment: `See the full curated guide here 👉 ${destinationUrl}\nAll finds: ${linksBioUrl}`,
    },
    youtubeShorts: {
      title: `${shortTitle(collection.title, 76)} #shorts`,
      description: `${collection.intro}\n\n🔗 Shop the full ${collection.productIds.length}-item list: ${destinationUrl}\n🏠 All Amazon finds: ${linksBioUrl}\n\n#shorts #amazonfinds #homeorganization`,
    },
  };
}
