"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  DollarSign,
  ExternalLink,
  Eye,
  MousePointerClick,
  Percent,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import type { AnalyticsEntry, Product } from "@/lib/types";
import { CATEGORY_LABELS, getProductCommissionRate } from "@/lib/types";
import { computeAnalyticsSummary } from "@/lib/analytics-utils";
import { extractAsin } from "@/lib/amazon-utils";

interface AnalyticsTabProps {
  entries: AnalyticsEntry[];
  products: Product[];
  usdToVndRate: number;
  amazonAssociateTag?: string;
  onEntriesChange: (entries: AnalyticsEntry[]) => void;
  onProductsChange?: (products: Product[]) => void;
}

const fmtVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";

export function AnalyticsTab({
  entries,
  products,
  usdToVndRate,
  amazonAssociateTag,
  onEntriesChange,
  onProductsChange,
}: AnalyticsTabProps) {
  const summary = useMemo(
    () => computeAnalyticsSummary(entries, usdToVndRate),
    [entries, usdToVndRate]
  );

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: "Amazon Associates",
    productId: "",
    views: "0",
    clicks: "0",
    orders: "0",
    revenueUsd: "0",
    commissionUsd: "0",
    notes: "",
  });
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Inline commission rate & estimated price editing per product
  const [rateDrafts, setRateDrafts] = useState<
    Record<string, { rate: string; price: string }>
  >({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);

  const hasSamples = entries.some((e) => e.isSample);

  const selectedFormProduct = products.find((p) => p.id === form.productId);
  const selectedFormRate = selectedFormProduct
    ? getProductCommissionRate(selectedFormProduct)
    : 3.0;

  // Map actual analytics performance by productId or normalized title
  const actualByProduct = useMemo(() => {
    const map = new Map<
      string,
      { clicks: number; orders: number; revenueUsd: number; commissionUsd: number }
    >();
    for (const tp of summary.topProducts) {
      if (tp.productId) {
        map.set(tp.productId, tp);
      }
      map.set(tp.productName.toLowerCase(), tp);
    }
    return map;
  }, [summary.topProducts]);

  const productCommissionRows = useMemo(() => {
    return products.map((p) => {
      const rate = getProductCommissionRate(p);
      const estPrice =
        typeof p.estimatedPriceUsd === "number" && Number.isFinite(p.estimatedPriceUsd)
          ? p.estimatedPriceUsd
          : 0;
      const estCommissionUsd =
        estPrice > 0 ? Math.round(((estPrice * rate) / 100) * 100) / 100 : 0;
      const estCommissionVnd = Math.round(estCommissionUsd * usdToVndRate);
      const actual =
        actualByProduct.get(p.id) || actualByProduct.get(p.title.toLowerCase());
      const asin = extractAsin(p.affiliateUrl);
      return {
        product: p,
        asin,
        rate,
        estPrice,
        estCommissionUsd,
        estCommissionVnd,
        actual,
      };
    });
  }, [products, usdToVndRate, actualByProduct]);

  const catalogAverages = useMemo(() => {
    if (productCommissionRows.length === 0) {
      return { avgRate: 0, avgEstCommissionUsd: 0, bestRow: null as (typeof productCommissionRows)[0] | null };
    }
    const avgRate =
      Math.round(
        (productCommissionRows.reduce((acc, r) => acc + r.rate, 0) /
          productCommissionRows.length) *
          100
      ) / 100;
    const withPrice = productCommissionRows.filter((r) => r.estPrice > 0);
    const avgEstCommissionUsd =
      withPrice.length > 0
        ? Math.round(
            (withPrice.reduce((acc, r) => acc + r.estCommissionUsd, 0) /
              withPrice.length) *
              100
          ) / 100
        : 0;
    const bestRow = [...productCommissionRows].sort(
      (a, b) => b.estCommissionUsd - a.estCommissionUsd
    )[0];
    return { avgRate, avgEstCommissionUsd, bestRow };
  }, [productCommissionRows]);

  async function handleSaveProductRate(product: Product) {
    const draft = rateDrafts[product.id];
    if (!draft) return;
    setSavingProductId(product.id);
    setStatus(null);
    try {
      const parsedRate = Number.parseFloat(draft.rate);
      const parsedPrice = Number.parseFloat(draft.price);
      const res = await fetch("/api/studio/products", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          commissionRatePercent: Number.isFinite(parsedRate) ? parsedRate : undefined,
          estimatedPriceUsd: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không cập nhật được tỷ lệ hoa hồng.");
      if (onProductsChange && data.products) {
        onProductsChange(data.products);
      }
      setRateDrafts((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      setSavedProductId(product.id);
      setTimeout(() => setSavedProductId(null), 1800);
    } catch (err) {
      setStatus({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi cập nhật hoa hồng sản phẩm.",
      });
    } finally {
      setSavingProductId(null);
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const matched = products.find((p) => p.id === form.productId);
      const res = await fetch("/api/studio/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          entry: {
            date: form.date,
            source: form.source,
            productId: matched?.id,
            productName: matched?.title || "General / Site-wide",
            views: Number(form.views) || 0,
            clicks: Number(form.clicks) || 0,
            orders: Number(form.orders) || 0,
            revenueUsd: Number(form.revenueUsd) || 0,
            commissionUsd: Number(form.commissionUsd) || 0,
            notes: form.notes,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không lưu được dữ liệu.");
      onEntriesChange(data.entries);
      setForm((prev) => ({
        ...prev,
        views: "0",
        clicks: "0",
        orders: "0",
        revenueUsd: "0",
        commissionUsd: "0",
        notes: "",
      }));
      setStatus({ type: "ok", text: "Đã ghi nhận số liệu báo cáo mới!" });
    } catch (err) {
      setStatus({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi lưu số liệu.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const csvText = await file.text();
      const res = await fetch("/api/studio/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "csv", csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import CSV thất bại.");
      onEntriesChange(data.entries);
      setStatus({
        type: "ok",
        text: `Đã import thành công ${data.importedCount} dòng từ báo cáo Amazon Associates CSV!`,
      });
    } catch (err) {
      setStatus({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi đọc file CSV.",
      });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(
      `/api/studio/analytics?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) onEntriesChange(data.entries);
  }

  async function handleClearSamples() {
    if (!confirm("Xóa toàn bộ dữ liệu thống kê mẫu?")) return;
    const res = await fetch("/api/studio/analytics?scope=samples", {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) onEntriesChange(data.entries);
  }

  const maxDailyClicks = Math.max(
    1,
    ...summary.dailySeries.map((d) => d.clicks)
  );

  return (
    <div className="space-y-8">
      {/* Header + 1-click CSV Import */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6DCCF] bg-white p-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
            Báo cáo Traffic, Chuyển đổi &amp; Hoa hồng thực nhận
          </h2>
          <p className="mt-1 text-xs text-[#665B52]">
            Tải file CSV từ bảng báo cáo Amazon Associates rồi bấm Import để cập nhật tự động doanh thu &amp; hoa hồng (tỷ giá quy đổi: 1 USD = {usdToVndRate.toLocaleString("vi-VN")} ₫).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#C25E3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#A54B2B]">
            <Upload className="h-4 w-4" />
            Import CSV Amazon Associates
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
          {hasSamples ? (
            <button
              type="button"
              onClick={handleClearSamples}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Xóa dữ liệu mẫu
            </button>
          ) : null}
        </div>
      </div>

      {status ? (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-medium ${
            status.type === "ok"
              ? "bg-[#EAEFE9] text-[#2F523B]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.text}
        </div>
      ) : null}

      {/* Amazon 3-First-Sales Milestone */}
      <div className="rounded-2xl border border-[#D4E2D7] bg-[#F2F7F3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4D6B57]">
              Mục tiêu đầu tiên — Duyệt chính thức Amazon Associates US
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1F1B18]">
              {summary.threeSalesProgress.completed
                ? `Tuyệt vời! Bạn đã đạt ${summary.threeSalesProgress.current}/3 đơn hàng hợp lệ!`
                : `Tiến độ: ${summary.threeSalesProgress.current} / 3 đơn hàng đầu tiên trong 180 ngày`}
            </p>
          </div>
          <span className="rounded-full bg-[#4D6B57] px-3 py-1 text-xs font-semibold text-white">
            {summary.threeSalesProgress.percent}%
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#4D6B57] transition-all"
            style={{ width: `${summary.threeSalesProgress.percent}%` }}
          />
        </div>
      </div>

      {/* Amazon Associates US Integration Panel */}
      <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#FFF3EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#B84A27]">
                Amazon Associates US
              </span>
              <span className="rounded-full bg-[#F4ECE1] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#1F1B18]">
                Tag: {amazonAssociateTag || "Chưa cài Tag"}
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-[#1F1B18]">
              Đồng bộ &amp; Theo dõi riêng từ Amazon Associates Central
            </h3>
            <p className="mt-0.5 text-xs text-[#665B52]">
              Mở nhanh báo cáo Amazon để tải CSV đơn hàng/hoa hồng, rồi bấm nút Import CSV ở trên để tự cộng vào Dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <a
              href="https://affiliate-program.amazon.com/home/reports"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1B18] px-3.5 py-2 font-semibold text-white hover:bg-[#3A332E]"
            >
              Báo cáo Amazon
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://affiliate-program.amazon.com/home/reports/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDD1C2] bg-[#FAF7F2] px-3.5 py-2 font-semibold text-[#1F1B18] hover:border-[#C25E3A]"
            >
              Tải CSV Amazon
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDD1C2] bg-white px-3.5 py-2 font-semibold text-[#5E534A] hover:border-[#C25E3A] hover:text-[#1F1B18]"
            >
              Biểu phí hoa hồng US
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#EFE6DA] bg-[#FAF7F2] p-3.5">
            <p className="text-[11px] font-medium text-[#665B52]">Amazon Clicks</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#1F1B18]">
              {summary.amazonSummary.clicks.toLocaleString("en-US")}
            </p>
          </div>
          <div className="rounded-xl border border-[#EFE6DA] bg-[#FAF7F2] p-3.5">
            <p className="text-[11px] font-medium text-[#665B52]">Đơn hàng Amazon</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#1F1B18]">
              {summary.amazonSummary.orders}
            </p>
            <p className="text-[10px] text-[#4D6B57]">
              Chuyển đổi: {summary.amazonSummary.conversionRate}%
            </p>
          </div>
          <div className="rounded-xl border border-[#EFE6DA] bg-[#FAF7F2] p-3.5">
            <p className="text-[11px] font-medium text-[#665B52]">Doanh thu Amazon</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#1F1B18]">
              ${summary.amazonSummary.revenueUsd.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-[#EFE6DA] bg-[#FFF8F4] p-3.5">
            <p className="text-[11px] font-medium text-[#B84A27]">Hoa hồng Amazon</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#B84A27]">
              ${summary.amazonSummary.commissionUsd.toFixed(2)}
            </p>
            <p className="text-[10px] text-[#7A6E64]">
              ≈ {fmtVnd(Math.round(summary.amazonSummary.commissionUsd * usdToVndRate))}
            </p>
          </div>
          <div className="rounded-xl border border-[#EFE6DA] bg-[#FAF7F2] p-3.5">
            <p className="text-[11px] font-medium text-[#665B52]">% Hoa hồng thực tế</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#2F523B]">
              {summary.amazonSummary.effectiveCommissionRate > 0
                ? `${summary.amazonSummary.effectiveCommissionRate}%`
                : `${catalogAverages.avgRate}%`}
            </p>
            <p className="text-[10px] text-[#7A6E64]">
              {summary.amazonSummary.effectiveCommissionRate > 0
                ? "Từ doanh thu Amazon thực"
                : "TB theo biểu phí danh mục"}
            </p>
          </div>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#665B52]">
            <span>Tổng lượt xem (Views)</span>
            <Eye className="h-4 w-4 text-[#4D6B57]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[#1F1B18]">
            {summary.totalViews.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs text-[#7A6E64]">Pinterest + Web Showcase</p>
        </div>

        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#665B52]">
            <span>Lượt click (Clicks) &amp; CTR</span>
            <MousePointerClick className="h-4 w-4 text-[#C25E3A]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[#1F1B18]">
            {summary.totalClicks.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs font-medium text-[#4D6B57]">
            Tỷ lệ click (CTR): {summary.ctr}%
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#665B52]">
            <span>Đơn hàng &amp; Tỷ lệ chuyển đổi</span>
            <Percent className="h-4 w-4 text-[#4D6B57]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[#1F1B18]">
            {summary.conversionRate}%
          </p>
          <p className="mt-1 text-xs text-[#7A6E64]">
            {summary.totalOrders} đơn hàng phát sinh
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#665B52]">
            <span>Tổng doanh thu tạo ra</span>
            <ShoppingBag className="h-4 w-4 text-[#665B52]" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-[#1F1B18]">
            ${summary.totalRevenueUsd.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[#7A6E64]">
            Tỷ lệ HH thực tế TB: {summary.avgCommissionRate}%
          </p>
        </div>

        <div className="rounded-2xl border border-[#C25E3A]/40 bg-[#FFF8F4] p-5 sm:col-span-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#C25E3A]">
            <span>Hoa hồng thực nhận (Actual Commission)</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-4">
            <p className="font-display text-4xl font-semibold text-[#1F1B18]">
              ${summary.totalCommissionUsd.toFixed(2)}
            </p>
            <p className="text-lg font-semibold text-[#C25E3A]">
              ≈ {fmtVnd(summary.totalCommissionVnd)}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#7A6E64]">
            Tự động tổng hợp từ báo cáo Amazon CSV &amp; dữ liệu nhập tay.
          </p>
        </div>
      </div>

      {/* Per-Product Amazon Commission Rates & Earnings Breakdown */}
      <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
              Tỷ lệ hoa hồng Amazon US trên từng sản phẩm ({products.length} món)
            </h3>
            <p className="mt-1 text-xs text-[#665B52]">
              Biểu phí chuẩn Amazon US: <strong>Kitchen 4.5%</strong> • <strong>Pantry / Bathroom / Organization 3.0%</strong>. Giá tham khảo chỉ dùng tính dự phóng nội bộ trong Studio (không hiển thị cứng lên web công khai để tuân thủ luật Amazon).
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-xl bg-[#FAF7F2] border border-[#E6DCCF] px-3 py-1.5 font-semibold text-[#1F1B18]">
              HH TB danh mục: <span className="text-[#C25E3A]">{catalogAverages.avgRate}%</span>
            </span>
            <span className="rounded-xl bg-[#FAF7F2] border border-[#E6DCCF] px-3 py-1.5 font-semibold text-[#1F1B18]">
              Ước tính / 1 đơn TB:{" "}
              <span className="text-[#2F523B]">
                ${catalogAverages.avgEstCommissionUsd.toFixed(2)} (≈{" "}
                {fmtVnd(Math.round(catalogAverages.avgEstCommissionUsd * usdToVndRate))})
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6DCCF] text-[11px] uppercase tracking-wider text-[#7A6E64]">
                <th className="py-2.5 pr-3">Sản phẩm &amp; ASIN</th>
                <th className="py-2.5 px-2">Danh mục</th>
                <th className="py-2.5 px-2">Tỷ lệ HH (%)</th>
                <th className="py-2.5 px-2">Giá tham khảo ($)</th>
                <th className="py-2.5 px-2">HH ước tính / đơn</th>
                <th className="py-2.5 px-2">Thực nhận (Amazon)</th>
                <th className="py-2.5 pl-2 text-right">Lưu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E9DE]">
              {productCommissionRows.map((row) => {
                const p = row.product;
                const draft = rateDrafts[p.id];
                const rateVal = draft ? draft.rate : String(row.rate);
                const priceVal = draft
                  ? draft.price
                  : row.estPrice > 0
                    ? String(row.estPrice)
                    : "";
                const liveRate = Number.parseFloat(rateVal) || 0;
                const livePrice = Number.parseFloat(priceVal) || 0;
                const liveEstUsd =
                  livePrice > 0
                    ? Math.round(((livePrice * liveRate) / 100) * 100) / 100
                    : 0;
                const liveEstVnd = Math.round(liveEstUsd * usdToVndRate);
                const isDirty = Boolean(draft);

                return (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]/70">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-9 w-9 shrink-0 rounded-lg border border-[#E6DCCF] object-cover bg-white"
                        />
                        <div className="min-w-0 max-w-[260px]">
                          <p className="truncate font-semibold text-[#1F1B18]">
                            {p.title}
                          </p>
                          <p className="font-mono text-[10px] text-[#7A6E64]">
                            {row.asin ? `ASIN: ${row.asin}` : p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="rounded-full bg-[#EAEFE9] px-2 py-0.5 text-[10px] font-semibold text-[#4D6B57]">
                        {CATEGORY_LABELS[p.category]}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={rateVal}
                          onChange={(e) =>
                            setRateDrafts((prev) => ({
                              ...prev,
                              [p.id]: {
                                rate: e.target.value,
                                price: priceVal,
                              },
                            }))
                          }
                          className="w-16 rounded-lg border border-[#DDD1C2] bg-white px-2 py-1 text-xs font-semibold text-[#B84A27]"
                        />
                        <span className="text-[#7A6E64]">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-[#7A6E64]">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceVal}
                          placeholder="0.00"
                          onChange={(e) =>
                            setRateDrafts((prev) => ({
                              ...prev,
                              [p.id]: {
                                rate: rateVal,
                                price: e.target.value,
                              },
                            }))
                          }
                          className="w-20 rounded-lg border border-[#DDD1C2] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <p className="font-semibold text-[#2F523B]">
                        ${liveEstUsd.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[#7A6E64]">
                        ≈ {fmtVnd(liveEstVnd)}
                      </p>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      {row.actual ? (
                        <div>
                          <p className="font-semibold text-[#C25E3A]">
                            ${row.actual.commissionUsd.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-[#7A6E64]">
                            {row.actual.orders} đơn • {row.actual.clicks} clicks
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9A8E83]">0 đơn</span>
                      )}
                    </td>
                    <td className="py-3 pl-2 text-right">
                      {savedProductId === p.id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F523B]">
                          <Check className="h-3.5 w-3.5" /> Đã lưu
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!isDirty || savingProductId === p.id}
                          onClick={() => handleSaveProductRate(p)}
                          className="rounded-lg bg-[#1F1B18] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#3A332E] disabled:opacity-30"
                        >
                          {savingProductId === p.id ? "..." : "Lưu"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart + Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C25E3A]" />
            <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
              Xu hướng Lượt Click &amp; Hoa hồng theo ngày
            </h3>
          </div>

          {summary.dailySeries.length === 0 ? (
            <p className="mt-6 text-center text-xs text-[#7A6E64]">
              Chưa có dữ liệu theo ngày.
            </p>
          ) : (
            <div className="mt-5 flex h-48 items-end gap-3 overflow-x-auto pb-2">
              {summary.dailySeries.slice(-10).map((day) => {
                const heightPct = Math.max(
                  10,
                  Math.round((day.clicks / maxDailyClicks) * 100)
                );
                return (
                  <div
                    key={day.date}
                    className="flex min-w-[52px] flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-[11px] font-semibold text-[#C25E3A]">
                      ${day.commissionUsd.toFixed(2)}
                    </span>
                    <div className="flex h-32 w-full items-end justify-center">
                      <div
                        className="w-8 rounded-t-lg bg-[#1F1B18] transition-all hover:bg-[#C25E3A]"
                        style={{ height: `${heightPct}%` }}
                        title={`${day.date}: ${day.views} views, ${day.clicks} clicks, $${day.commissionUsd}`}
                      />
                    </div>
                    <span className="text-[10px] text-[#665B52]">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
            Top sản phẩm ra tiền tốt nhất
          </h3>
          {summary.topProducts.length === 0 ? (
            <p className="mt-6 text-center text-xs text-[#7A6E64]">
              Chưa có đơn hàng phát sinh. Import CSV từ Amazon Associates để xem xếp hạng.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {summary.topProducts.slice(0, 6).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF7F2] px-3.5 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1F1B18]">
                      {i + 1}. {item.productName}
                    </p>
                    <p className="text-[#665B52]">
                      {item.views.toLocaleString()} views • {item.clicks} clicks •{" "}
                      {item.orders} đơn
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-[#C25E3A]">
                      ${item.commissionUsd.toFixed(2)}{" "}
                      {item.commissionRate > 0 ? (
                        <span className="text-[10px] text-[#2F523B]">
                          ({item.commissionRate}%)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-[#7A6E64]">
                      DT: ${item.revenueUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Manual Entry + Entries History */}
      <div className="grid gap-6 lg:grid-cols-5">
        <form
          onSubmit={handleAddManual}
          className="rounded-2xl border border-[#E6DCCF] bg-white p-5 lg:col-span-2 space-y-3 text-xs h-fit"
        >
          <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
            Nhập nhanh số liệu (Pinterest / Web / Amazon)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#352E29]">Ngày</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-[#352E29]">Nguồn</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2"
              >
                <option value="Amazon Associates">Amazon Associates</option>
                <option value="Pinterest">Pinterest</option>
                <option value="Web Showcase">Web Showcase</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#352E29]">
              Sản phẩm (tùy chọn)
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2"
            >
              <option value="">-- Chung toàn trang --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({getProductCommissionRate(p)}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-[#352E29]">Lượt xem</label>
              <input
                type="number"
                min={0}
                value={form.views}
                onChange={(e) => setForm({ ...form, views: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-[#352E29]">Lượt click</label>
              <input
                type="number"
                min={0}
                value={form.clicks}
                onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-[#352E29]">Số đơn</label>
              <input
                type="number"
                min={0}
                value={form.orders}
                onChange={(e) => setForm({ ...form, orders: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-2.5 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#352E29]">
                Doanh thu đơn (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.revenueUsd}
                onChange={(e) =>
                  setForm({ ...form, revenueUsd: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3 py-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-1">
                <label className="block font-medium text-[#352E29]">
                  Hoa hồng (USD)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rev = Number.parseFloat(form.revenueUsd) || 0;
                    const est =
                      Math.round(((rev * selectedFormRate) / 100) * 100) / 100;
                    setForm((prev) => ({
                      ...prev,
                      commissionUsd: est.toFixed(2),
                    }));
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#B84A27] hover:underline"
                  title="Tự tính hoa hồng theo % Amazon của sản phẩm"
                >
                  <Calculator className="h-3 w-3" />
                  Tính {selectedFormRate}%
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.commissionUsd}
                onChange={(e) =>
                  setForm({ ...form, commissionUsd: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1F1B18] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3A332E]"
          >
            <Plus className="h-4 w-4" />
            Lưu dòng báo cáo
          </button>
        </form>

        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5 lg:col-span-3">
          <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
            Lịch sử ghi nhận ({entries.length} dòng)
          </h3>
          <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#EFE6DA] px-3.5 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#1F1B18]">{e.date}</span>
                    <span className="rounded-full bg-[#F2EBE0] px-2 py-0.5 text-[10px] font-semibold">
                      {e.source}
                    </span>
                    {e.isSample ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Mẫu
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[#5E534A]">
                    {e.productName} — {e.views} views • {e.clicks} clicks •{" "}
                    {e.orders} đơn
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-[#C25E3A]">
                    +${e.commissionUsd.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="text-[#8A7D72] hover:text-red-600"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
