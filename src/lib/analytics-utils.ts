import type { AnalyticsEntry } from "./types";

export interface DailySeriesPoint {
  date: string;
  views: number;
  clicks: number;
  orders: number;
  commissionUsd: number;
}

export interface TopProductPerformance {
  productName: string;
  productId?: string;
  views: number;
  clicks: number;
  orders: number;
  revenueUsd: number;
  commissionUsd: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  ctr: number; // percentage 0..100
  conversionRate: number; // percentage 0..100
  totalRevenueUsd: number;
  totalCommissionUsd: number;
  totalCommissionVnd: number;
  threeSalesProgress: {
    current: number;
    target: number;
    percent: number;
    completed: boolean;
  };
  dailySeries: DailySeriesPoint[];
  topProducts: TopProductPerformance[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeAnalyticsSummary(
  entries: AnalyticsEntry[],
  usdToVndRate: number
): AnalyticsSummary {
  let totalViews = 0;
  let totalClicks = 0;
  let totalOrders = 0;
  let totalRevenueUsd = 0;
  let totalCommissionUsd = 0;

  const byDate = new Map<string, DailySeriesPoint>();
  const byProduct = new Map<string, TopProductPerformance>();

  for (const e of entries) {
    const views = Number.isFinite(e.views) ? Math.max(0, e.views) : 0;
    const clicks = Number.isFinite(e.clicks) ? Math.max(0, e.clicks) : 0;
    const orders = Number.isFinite(e.orders) ? Math.max(0, e.orders) : 0;
    const revenueUsd = Number.isFinite(e.revenueUsd)
      ? Math.max(0, e.revenueUsd)
      : 0;
    const commissionUsd = Number.isFinite(e.commissionUsd)
      ? Math.max(0, e.commissionUsd)
      : 0;

    totalViews += views;
    totalClicks += clicks;
    totalOrders += orders;
    totalRevenueUsd += revenueUsd;
    totalCommissionUsd += commissionUsd;

    const dateKey = e.date || "Unknown";
    const existingDay = byDate.get(dateKey) ?? {
      date: dateKey,
      views: 0,
      clicks: 0,
      orders: 0,
      commissionUsd: 0,
    };
    existingDay.views += views;
    existingDay.clicks += clicks;
    existingDay.orders += orders;
    existingDay.commissionUsd = round2(existingDay.commissionUsd + commissionUsd);
    byDate.set(dateKey, existingDay);

    const prodLabel = e.productName?.trim() || "General / Site-wide";
    const prodKey = e.productId || prodLabel.toLowerCase();
    const existingProd = byProduct.get(prodKey) ?? {
      productName: prodLabel,
      productId: e.productId,
      views: 0,
      clicks: 0,
      orders: 0,
      revenueUsd: 0,
      commissionUsd: 0,
    };
    existingProd.views += views;
    existingProd.clicks += clicks;
    existingProd.orders += orders;
    existingProd.revenueUsd = round2(existingProd.revenueUsd + revenueUsd);
    existingProd.commissionUsd = round2(
      existingProd.commissionUsd + commissionUsd
    );
    byProduct.set(prodKey, existingProd);
  }

  const ctr = totalViews > 0 ? round2((totalClicks / totalViews) * 100) : 0;
  const conversionRate =
    totalClicks > 0 ? round2((totalOrders / totalClicks) * 100) : 0;
  const safeRate =
    Number.isFinite(usdToVndRate) && usdToVndRate > 0 ? usdToVndRate : 25400;
  const totalCommissionVnd = Math.round(totalCommissionUsd * safeRate);

  const target = 3;
  const percent = Math.min(100, Math.round((totalOrders / target) * 100));

  const dailySeries = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const topProducts = Array.from(byProduct.values()).sort((a, b) => {
    if (b.commissionUsd !== a.commissionUsd) {
      return b.commissionUsd - a.commissionUsd;
    }
    return b.clicks - a.clicks;
  });

  return {
    totalViews,
    totalClicks,
    totalOrders,
    ctr,
    conversionRate,
    totalRevenueUsd: round2(totalRevenueUsd),
    totalCommissionUsd: round2(totalCommissionUsd),
    totalCommissionVnd,
    threeSalesProgress: {
      current: totalOrders,
      target,
      percent,
      completed: totalOrders >= target,
    },
    dailySeries,
    topProducts,
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNumberCell(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function normalizeDate(value: string | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseAmazonAssociatesCsv(
  csvText: string
): Omit<AnalyticsEntry, "id">[] {
  const cleaned = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Find the header row (Amazon sometimes puts a 1-line report title before headers)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i += 1) {
    const lower = lines[i].toLowerCase();
    if (
      lower.includes("click") ||
      lower.includes("revenue") ||
      lower.includes("fee") ||
      lower.includes("commission") ||
      lower.includes("ordered") ||
      lower.includes("date")
    ) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCsvLine(lines[headerIdx]).map((h) => h.toLowerCase());
  const findCol = (patterns: string[]): number =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  const dateCol = findCol(["date", "day", "time"]);
  const nameCol = findCol(["product", "item name", "title", "name"]);
  const viewsCol = findCol(["view", "impression"]);
  const clicksCol = findCol(["click"]);
  const ordersCol = findCol(["ordered", "shipped items", "orders", "qty", "quantity"]);
  const revenueCol = findCol(["shipped revenue", "revenue", "sales"]);
  const commissionCol = findCol(["advertising fee", "ad fee", "commission", "earning", "fees"]);

  const rows: Omit<AnalyticsEntry, "id">[] = [];
  for (let i = headerIdx + 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length === 0 || cells.every((c) => c === "")) continue;

    const views = viewsCol >= 0 ? Math.round(parseNumberCell(cells[viewsCol])) : 0;
    const clicks = clicksCol >= 0 ? Math.round(parseNumberCell(cells[clicksCol])) : 0;
    const orders = ordersCol >= 0 ? Math.round(parseNumberCell(cells[ordersCol])) : 0;
    const revenueUsd = revenueCol >= 0 ? round2(parseNumberCell(cells[revenueCol])) : 0;
    const commissionUsd =
      commissionCol >= 0 ? round2(parseNumberCell(cells[commissionCol])) : 0;

    if (views === 0 && clicks === 0 && orders === 0 && revenueUsd === 0 && commissionUsd === 0) {
      continue;
    }

    rows.push({
      date: normalizeDate(dateCol >= 0 ? cells[dateCol] : undefined),
      source: "Amazon CSV",
      productName:
        nameCol >= 0 && cells[nameCol] ? cells[nameCol] : "Amazon Associates Report",
      views,
      clicks,
      orders,
      revenueUsd,
      commissionUsd,
      notes: "Imported from Amazon Associates CSV",
      isSample: false,
    });
  }

  return rows;
}
