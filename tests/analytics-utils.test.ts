import { describe, it, expect } from "vitest";
import {
  computeAnalyticsSummary,
  parseAmazonAssociatesCsv,
} from "../src/lib/analytics-utils";
import type { AnalyticsEntry } from "../src/lib/types";

describe("analytics-utils", () => {
  it("handles empty analytics without division by zero", () => {
    const summary = computeAnalyticsSummary([], 25400);
    expect(summary.totalViews).toBe(0);
    expect(summary.totalClicks).toBe(0);
    expect(summary.ctr).toBe(0);
    expect(summary.conversionRate).toBe(0);
    expect(summary.totalRevenueUsd).toBe(0);
    expect(summary.totalCommissionUsd).toBe(0);
    expect(summary.totalCommissionVnd).toBe(0);
    expect(summary.threeSalesProgress).toEqual({
      current: 0,
      target: 3,
      percent: 0,
      completed: false,
    });
  });

  it("computes KPIs, VND conversion, 3-sales progress, and top products", () => {
    const entries: AnalyticsEntry[] = [
      {
        id: "1",
        date: "2026-11-20",
        source: "Pinterest",
        productId: "p1",
        productName: "Spice Rack",
        views: 1000,
        clicks: 50,
        orders: 2,
        revenueUsd: 50,
        commissionUsd: 2.0,
      },
      {
        id: "2",
        date: "2026-11-19",
        source: "Amazon CSV",
        productId: "p2",
        productName: "Fridge Bins",
        views: 500,
        clicks: 50,
        orders: 2,
        revenueUsd: 100,
        commissionUsd: 4.0,
      },
    ];

    const summary = computeAnalyticsSummary(entries, 25000);
    expect(summary.totalViews).toBe(1500);
    expect(summary.totalClicks).toBe(100);
    expect(summary.totalOrders).toBe(4);
    expect(summary.ctr).toBeCloseTo(6.67, 1);
    expect(summary.conversionRate).toBeCloseTo(4.0, 1);
    expect(summary.totalRevenueUsd).toBe(150);
    expect(summary.totalCommissionUsd).toBe(6);
    expect(summary.totalCommissionVnd).toBe(150000);
    expect(summary.threeSalesProgress.completed).toBe(true);
    expect(summary.threeSalesProgress.percent).toBe(100);
    expect(summary.dailySeries[0].date).toBe("2026-11-19");
    expect(summary.topProducts[0].productName).toBe("Fridge Bins");
  });

  it("parses messy Amazon Associates CSV with BOM, quoted commas, and currency formatting", () => {
    const csv = `\uFEFFDate,Product Name,Clicks,Ordered Items,Shipped Revenue,Advertising Fees
2026-11-21,"Organizer, 2-Tier Under Sink",42,2,"$1,245.50","$49.82"
2026-11-22,"Spice Rack, Matte Black",18,1,$24.99,$1.00

`;
    const rows = parseAmazonAssociatesCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: "2026-11-21",
      source: "Amazon CSV",
      productName: "Organizer, 2-Tier Under Sink",
      clicks: 42,
      orders: 2,
      revenueUsd: 1245.5,
      commissionUsd: 49.82,
      isSample: false,
    });
    expect(rows[1].revenueUsd).toBe(24.99);
    expect(rows[1].commissionUsd).toBe(1);
  });
});
