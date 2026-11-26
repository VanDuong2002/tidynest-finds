export type ProductCategory = "kitchen" | "pantry" | "bathroom" | "organization";

export type PriceBadge =
  | "Under $25"
  | "Under $50"
  | "Best Seller"
  | "Space Saver"
  | "Gift Idea";

export type PinTemplateId = "editorial" | "bold-banner" | "listicle-collage";

export interface SiteConfig {
  siteName: string;
  tagline: string;
  disclosureText: string;
  pinterestUrl: string;
  gaMeasurementId: string;
  usdToVndRate: number;
  baseUrl: string;
  amazonAssociateTag?: string;
}

export interface StudioSecrets {
  pinterestAccessToken: string;
  pinterestBoardId: string;
  pinterestSandbox?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: ProductCategory;
  badge: PriceBadge;
  affiliateUrl: string;
  imageUrl: string;
  shortPitch: string;
  highlights: string[];
  featured: boolean;
  isSample: boolean;
  ratingLabel?: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  productIds: string[];
  intro: string;
  isSample: boolean;
  createdAt: string;
}

export interface AnalyticsEntry {
  id: string;
  date: string; // YYYY-MM-DD
  source: string; // e.g. "Pinterest", "Web Showcase", "Amazon CSV"
  productId?: string;
  productName?: string;
  views: number;
  clicks: number;
  orders: number;
  revenueUsd: number;
  commissionUsd: number;
  notes?: string;
  isSample?: boolean;
}

export interface PinterestCopyVariation {
  angle: string;
  title: string;
  description: string;
  hashtags: string[];
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  kitchen: "Kitchen & Cooking",
  pantry: "Pantry & Fridge",
  bathroom: "Bathroom & Vanity",
  organization: "Home Organization",
};

export const PRICE_BADGES: PriceBadge[] = [
  "Under $25",
  "Under $50",
  "Best Seller",
  "Space Saver",
  "Gift Idea",
];
