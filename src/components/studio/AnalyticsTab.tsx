"use client";

import { useMemo, useState } from "react";
import {
  DollarSign,
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
import { computeAnalyticsSummary } from "@/lib/analytics-utils";

interface AnalyticsTabProps {
  entries: AnalyticsEntry[];
  products: Product[];
  usdToVndRate: number;
  onEntriesChange: (entries: AnalyticsEntry[]) => void;
}

const fmtVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";

export function AnalyticsTab({
  entries,
  products,
  usdToVndRate,
  onEntriesChange,
}: AnalyticsTabProps) {
  const summary = useMemo(
    () => computeAnalyticsSummary(entries, usdToVndRate),
    [entries, usdToVndRate]
  );

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: "Pinterest",
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

  const hasSamples = entries.some((e) => e.isSample);

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
          <p className="mt-1 text-xs text-[#7A6E64]">Giá trị đơn hàng trên Amazon</p>
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
                    ${item.commissionUsd.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[#7A6E64]">
                    DT: ${item.revenueUsd.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
                <option value="Pinterest">Pinterest</option>
                <option value="Web Showcase">Web Showcase</option>
                <option value="Amazon Associates">Amazon Associates</option>
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
                  {p.title}
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
              <label className="block font-medium text-[#352E29]">
                Hoa hồng thực nhận (USD)
              </label>
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
