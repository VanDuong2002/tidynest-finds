import fs from "node:fs";
import path from "node:path";
import type {
  AnalyticsEntry,
  Collection,
  Product,
  SiteConfig,
  StudioSecrets,
} from "./types";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");

const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "TidyNest Finds",
  tagline: "Smart Home & Kitchen Finds That Make Everyday Living Effortless",
  disclosureText: "As an Amazon Associate I earn from qualifying purchases.",
  pinterestUrl: "https://www.pinterest.com/",
  gaMeasurementId: "",
  usdToVndRate: 25400,
  baseUrl: "http://localhost:3000",
  amazonAssociateTag: "",
};

const DEFAULT_STUDIO_SECRETS: StudioSecrets = {
  pinterestAccessToken: "",
  pinterestBoardId: "",
  pinterestSandbox: false,
};

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  const cleanBase = slugify(baseSlug) || "item";
  const used = new Set(existingSlugs);
  if (!used.has(cleanBase)) {
    return cleanBase;
  }
  let counter = 2;
  while (used.has(`${cleanBase}-${counter}`)) {
    counter += 1;
  }
  return `${cleanBase}-${counter}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGaMeasurementId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^(G|GT|AW|UA)-[A-Z0-9-]+$/i.test(trimmed);
}

export function isSafeImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/images/")) {
    return !trimmed.includes("..");
  }
  return isValidHttpUrl(trimmed);
}

export function isSafeExternalHttpUrl(value: string): boolean {
  if (!isValidHttpUrl(value)) return false;
  try {
    const { hostname } = new URL(value.trim());
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    if (/^127\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^169\.254\./.test(host)) return false;
    const m172 = /^172\.(\d+)\./.exec(host);
    if (m172) {
      const second = Number(m172[1]);
      if (second >= 16 && second <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function readSiteConfig(dataDir = DEFAULT_DATA_DIR): SiteConfig {
  return {
    ...DEFAULT_SITE_CONFIG,
    ...readJsonFile<Partial<SiteConfig>>(
      path.join(dataDir, "site-config.json"),
      {}
    ),
  };
}

export function writeSiteConfig(
  config: SiteConfig,
  dataDir = DEFAULT_DATA_DIR
): void {
  writeJsonFile(path.join(dataDir, "site-config.json"), config);
}

export function readProducts(dataDir = DEFAULT_DATA_DIR): Product[] {
  return readJsonFile<Product[]>(path.join(dataDir, "products.json"), []);
}

export function writeProducts(
  products: Product[],
  dataDir = DEFAULT_DATA_DIR
): void {
  writeJsonFile(path.join(dataDir, "products.json"), products);
}

export function readCollections(dataDir = DEFAULT_DATA_DIR): Collection[] {
  return readJsonFile<Collection[]>(path.join(dataDir, "collections.json"), []);
}

export function writeCollections(
  collections: Collection[],
  dataDir = DEFAULT_DATA_DIR
): void {
  writeJsonFile(path.join(dataDir, "collections.json"), collections);
}

export function readAnalytics(dataDir = DEFAULT_DATA_DIR): AnalyticsEntry[] {
  return readJsonFile<AnalyticsEntry[]>(
    path.join(dataDir, "analytics.json"),
    []
  );
}

export function writeAnalytics(
  entries: AnalyticsEntry[],
  dataDir = DEFAULT_DATA_DIR
): void {
  writeJsonFile(path.join(dataDir, "analytics.json"), entries);
}

export function readStudioSecrets(dataDir = DEFAULT_DATA_DIR): StudioSecrets {
  return {
    ...DEFAULT_STUDIO_SECRETS,
    ...readJsonFile<Partial<StudioSecrets>>(
      path.join(dataDir, "studio-secrets.json"),
      {}
    ),
  };
}

export function writeStudioSecrets(
  secrets: StudioSecrets,
  dataDir = DEFAULT_DATA_DIR
): void {
  writeJsonFile(path.join(dataDir, "studio-secrets.json"), secrets);
}
