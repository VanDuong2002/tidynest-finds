"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Collection, Product } from "@/lib/types";

interface CollectionsTabProps {
  collections: Collection[];
  products: Product[];
  onCollectionsChange: (collections: Collection[]) => void;
  onCreatePinForCollection: (collectionId: string) => void;
}

const EMPTY_FORM = {
  id: "",
  title: "",
  subtitle: "",
  coverImageUrl: "",
  intro: "",
  productIds: [] as string[],
};

export function CollectionsTab({
  collections,
  products,
  onCollectionsChange,
  onCreatePinForCollection,
}: CollectionsTabProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function toggleProduct(id: string) {
    setForm((prev) => {
      const exists = prev.productIds.includes(id);
      const nextIds = exists
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id];
      const firstProd = products.find((p) => p.id === nextIds[0]);
      return {
        ...prev,
        productIds: nextIds,
        coverImageUrl: prev.coverImageUrl || firstProd?.imageUrl || "",
      };
    });
  }

  function startEdit(c: Collection) {
    setForm({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      coverImageUrl: c.coverImageUrl,
      intro: c.intro,
      productIds: c.productIds,
    });
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/studio/collections", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu bộ sưu tập thất bại.");
      onCollectionsChange(data.collections);
      setForm(EMPTY_FORM);
      setMessage({
        type: "ok",
        text: form.id ? "Đã cập nhật bộ sưu tập!" : "Đã tạo bộ sưu tập mới!",
      });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi lưu bộ sưu tập.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa bộ sưu tập này?")) return;
    const res = await fetch(
      `/api/studio/collections?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) onCollectionsChange(data.collections);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E6DCCF] bg-white p-6 shadow-sm lg:col-span-2 h-fit space-y-4 text-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
            {form.id ? "Sửa bộ sưu tập" : "Tạo Bộ sưu tập (Top List)"}
          </h2>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="text-xs text-[#665B52] hover:text-[#1F1B18]"
            >
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Tiêu đề bài Top List (Tiếng Anh) *
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="VD: 5 Amazon Kitchen Organizers Under $30"
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Mô tả ngắn (Tiếng Anh)
          </label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Small-space kitchen upgrades you can set up in 5 minutes."
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Đoạn mở đầu (Tiếng Anh)
          </label>
          <textarea
            rows={3}
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
            placeholder="Curated renter-friendly favorites..."
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2 focus:border-[#C25E3A] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Chọn sản phẩm đưa vào bộ sưu tập ({form.productIds.length} món)
          </label>
          <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-3">
            {products.map((p) => {
              const checked = form.productIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-white px-2.5 py-2 text-xs hover:bg-[#F5EFE6]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="truncate font-medium text-[#1F1B18]">
                    {p.title}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

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
          {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Tạo bộ sưu tập"}
        </button>
      </form>

      <div className="lg:col-span-3 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
            Các bộ sưu tập ({collections.length})
          </h2>
          <p className="text-xs text-[#665B52]">
            1 Pin dẫn về bài Top 4–5 sản phẩm thường kéo nhiều lượt bấm Amazon hơn Pin đơn lẻ.
          </p>
        </div>

        <div className="space-y-3">
          {collections.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-2xl border border-[#E6DCCF] bg-white p-4 sm:flex-row sm:items-center"
            >
              <img
                src={c.coverImageUrl}
                alt={c.title}
                className="h-20 w-20 shrink-0 rounded-xl border border-[#E6DCCF] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAEFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4D6B57]">
                    {c.productIds.length} sản phẩm
                  </span>
                  {c.isSample ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      Mẫu
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold text-[#1F1B18]">{c.title}</p>
                <a
                  href={`/collections/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#665B52] hover:text-[#C25E3A]"
                >
                  /collections/{c.slug} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreatePinForCollection(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1B18] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3A332E]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tạo Pin ghép
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="rounded-xl border border-[#E6DCCF] p-2 text-[#4F463F] hover:border-[#C25E3A] hover:text-[#C25E3A]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
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
