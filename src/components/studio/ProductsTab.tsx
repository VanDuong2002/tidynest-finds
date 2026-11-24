"use client";

import { useState } from "react";
import {
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { PriceBadge, Product, ProductCategory } from "@/lib/types";
import { CATEGORY_LABELS, PRICE_BADGES } from "@/lib/types";

interface ProductsTabProps {
  products: Product[];
  onProductsChange: (products: Product[], collections?: import("@/lib/types").Collection[]) => void;
  onCreatePinForProduct: (productId: string) => void;
}

const EMPTY_FORM = {
  id: "",
  title: "",
  category: "kitchen" as ProductCategory,
  badge: "Under $25" as PriceBadge,
  affiliateUrl: "",
  imageUrl: "",
  shortPitch: "",
  highlightsText: "",
  featured: true,
};

export function ProductsTab({
  products,
  onProductsChange,
  onCreatePinForProduct,
}: ProductsTabProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const hasSamples = products.some((p) => p.isSample);

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      title: p.title,
      category: p.category,
      badge: p.badge,
      affiliateUrl: p.affiliateUrl,
      imageUrl: p.imageUrl,
      shortPitch: p.shortPitch,
      highlightsText: p.highlights.join("\n"),
      featured: p.featured,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/studio/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại.");
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      setMessage({ type: "ok", text: "Đã tải ảnh lên thành công!" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi upload ảnh.",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      id: form.id || undefined,
      title: form.title,
      category: form.category,
      badge: form.badge,
      affiliateUrl: form.affiliateUrl,
      imageUrl: form.imageUrl,
      shortPitch: form.shortPitch,
      highlights: form.highlightsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      featured: form.featured,
    };

    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/studio/products", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không lưu được sản phẩm.");
      onProductsChange(data.products);
      setForm(EMPTY_FORM);
      setMessage({
        type: "ok",
        text: form.id ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm mới!",
      });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi lưu sản phẩm.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    const res = await fetch(`/api/studio/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) onProductsChange(data.products, data.collections);
  }

  async function handleClearSamples() {
    if (!confirm("Xóa toàn bộ sản phẩm mẫu để chỉ giữ sản phẩm thật của bạn?"))
      return;
    const res = await fetch("/api/studio/products?scope=samples", {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) onProductsChange(data.products, data.collections);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E6DCCF] bg-white p-6 shadow-sm lg:col-span-2 h-fit"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
            {form.id ? "Sửa sản phẩm" : "Thêm sản phẩm Amazon mới"}
          </h2>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="text-xs font-medium text-[#665B52] hover:text-[#1F1B18]"
            >
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-medium text-[#352E29]">
              Tên sản phẩm (Tiếng Anh cho khách Mỹ) *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Magnetic Fridge Spice Rack Organizer (4-Pack)"
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#352E29]">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as ProductCategory,
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2 focus:border-[#C25E3A] focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#352E29]">
                Nhãn nổi bật (không ghi giá cứng)
              </label>
              <select
                value={form.badge}
                onChange={(e) =>
                  setForm({ ...form, badge: e.target.value as PriceBadge })
                }
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2 focus:border-[#C25E3A] focus:outline-none"
              >
                {PRICE_BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#352E29]">
              Link Affiliate Amazon (SiteStripe / amzn.to) *
            </label>
            <input
              required
              type="url"
              value={form.affiliateUrl}
              onChange={(e) =>
                setForm({ ...form, affiliateUrl: e.target.value })
              }
              placeholder="https://amzn.to/..."
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#352E29]">
              Ảnh sản phẩm (Tải từ máy hoặc dán URL)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="/images/uploads/... hoặc https://..."
                className="flex-1 rounded-xl border border-[#DDD1C2] px-3 py-2 focus:border-[#C25E3A] focus:outline-none"
              />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#DDD1C2] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#1F1B18] hover:border-[#C25E3A]">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Đang tải..." : "Tải ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#352E29]">
              Mô tả ngắn (1–2 câu tiếng Anh)
            </label>
            <textarea
              rows={2}
              value={form.shortPitch}
              onChange={(e) => setForm({ ...form, shortPitch: e.target.value })}
              placeholder="Frees up counter space in 10 seconds with zero drilling..."
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#352E29]">
              Điểm nổi bật (mỗi dòng 1 ý tiếng Anh)
            </label>
            <textarea
              rows={3}
              value={form.highlightsText}
              onChange={(e) =>
                setForm({ ...form, highlightsText: e.target.value })
              }
              placeholder={"Strong magnet holds up to 11 lbs\nRenter-friendly, no tools needed"}
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[#4F463F]">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="rounded border-[#DDD1C2]"
            />
            Đánh dấu sản phẩm nổi bật
          </label>

          {message ? (
            <p
              className={`rounded-xl px-3.5 py-2 text-xs font-medium ${
                message.type === "ok"
                  ? "bg-[#EAEFE9] text-[#2F523B]"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C25E3A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A54B2B] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {saving
              ? "Đang lưu..."
              : form.id
                ? "Lưu thay đổi"
                : "Lưu sản phẩm"}
          </button>
        </div>
      </form>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
              Danh sách sản phẩm ({products.length})
            </h2>
            <p className="text-xs text-[#665B52]">
              Bấm &quot;Tạo ảnh Pin&quot; để chuyển thẳng sang xưởng vẽ ảnh 1000×1500 và lấy nội dung tiếng Anh.
            </p>
          </div>
          {hasSamples ? (
            <button
              type="button"
              onClick={handleClearSamples}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Xóa toàn bộ sản phẩm mẫu
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-[#E6DCCF] bg-white p-4 sm:flex-row sm:items-center"
            >
              <img
                src={p.imageUrl}
                alt={p.title}
                className="h-20 w-20 shrink-0 rounded-xl border border-[#E6DCCF] object-cover bg-[#FAF7F2]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAEFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4D6B57]">
                    {CATEGORY_LABELS[p.category]}
                  </span>
                  <span className="rounded-full bg-[#F2EBE0] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F1B18]">
                    {p.badge}
                  </span>
                  {p.isSample ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      Sản phẩm mẫu
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold text-[#1F1B18] truncate">
                  {p.title}
                </p>
                <a
                  href={`/finds/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#665B52] hover:text-[#C25E3A]"
                >
                  /finds/{p.slug} <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreatePinForProduct(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1B18] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3A332E]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tạo ảnh Pin
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  title="Sửa"
                  className="rounded-xl border border-[#E6DCCF] p-2 text-[#4F463F] hover:border-[#C25E3A] hover:text-[#C25E3A]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  title="Xóa"
                  className="rounded-xl border border-[#E6DCCF] p-2 text-[#4F463F] hover:border-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
