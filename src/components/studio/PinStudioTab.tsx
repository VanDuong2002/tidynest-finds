"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Sparkles } from "lucide-react";
import type {
  Collection,
  PinTemplateId,
  Product,
  SiteConfig,
} from "@/lib/types";
import {
  generateCollectionPinCopy,
  generateProductPinCopy,
} from "@/lib/copy-generator";
import {
  renderPinToCanvas,
  type PinThemeId,
} from "@/lib/pin-renderer";

interface PinStudioTabProps {
  config: SiteConfig;
  products: Product[];
  collections: Collection[];
  initialTarget?: { type: "product" | "collection"; id: string } | null;
}

const TEMPLATES: { id: PinTemplateId; label: string; desc: string }[] = [
  {
    id: "editorial",
    label: "Editorial Clean",
    desc: "Nền kem sang trọng, hợp đồ bếp & nhà cửa",
  },
  {
    id: "bold-banner",
    label: "Bold Top Banner",
    desc: "Chữ nổi bật phía trên, ảnh tràn khung dưới",
  },
  {
    id: "listicle-collage",
    label: "Collage 4 ảnh",
    desc: "Cực hợp cho Bộ sưu tập Top 4–5 sản phẩm",
  },
];

const THEMES: { id: PinThemeId; label: string; swatch: string }[] = [
  { id: "cream", label: "Kem ấm", swatch: "#FAF7F2" },
  { id: "terracotta", label: "Cam đất", swatch: "#C25E3A" },
  { id: "sage", label: "Xanh rêu", swatch: "#4D6B57" },
  { id: "espresso", label: "Nâu đậm", swatch: "#1F1B18" },
];

export function PinStudioTab({
  config,
  products,
  collections,
  initialTarget,
}: PinStudioTabProps) {
  const defaultType = initialTarget?.type ?? "product";
  const defaultId =
    initialTarget?.id ??
    (defaultType === "product" ? products[0]?.id : collections[0]?.id) ??
    "";

  const [targetType, setTargetType] = useState<"product" | "collection">(
    defaultType
  );
  const [targetId, setTargetId] = useState<string>(defaultId);
  const [template, setTemplate] = useState<PinTemplateId>(
    defaultType === "collection" ? "listicle-collage" : "editorial"
  );
  const [theme, setTheme] = useState<PinThemeId>("cream");
  const [customHeadline, setCustomHeadline] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialTarget) {
      setTargetType(initialTarget.type);
      setTargetId(initialTarget.id);
      setTemplate(
        initialTarget.type === "collection" ? "listicle-collage" : "editorial"
      );
      setCustomHeadline("");
      setCustomBadge("");
    }
  }, [initialTarget]);

  const activeProduct =
    targetType === "product"
      ? products.find((p) => p.id === targetId) ?? products[0]
      : undefined;

  const activeCollection =
    targetType === "collection"
      ? collections.find((c) => c.id === targetId) ?? collections[0]
      : undefined;

  const collectionProducts = useMemo(() => {
    if (!activeCollection) return [];
    const map = new Map(products.map((p) => [p.id, p]));
    return activeCollection.productIds
      .map((id) => map.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [activeCollection, products]);

  const effectiveHeadline =
    customHeadline.trim() ||
    (targetType === "product"
      ? activeProduct?.title || "Amazon Home Find"
      : activeCollection?.title || "Top Amazon Kitchen Finds");

  const effectiveBadge =
    customBadge.trim() ||
    (targetType === "product"
      ? activeProduct?.badge || "AMAZON FIND"
      : `${collectionProducts.length || 4} AMAZON PICKS`);

  const imageUrls = useMemo(() => {
    if (targetType === "product") {
      return activeProduct?.imageUrl ? [activeProduct.imageUrl] : [];
    }
    const imgs = collectionProducts.map((p) => p.imageUrl).filter(Boolean);
    if (imgs.length > 0) return imgs;
    return activeCollection?.coverImageUrl
      ? [activeCollection.coverImageUrl]
      : [];
  }, [targetType, activeProduct, activeCollection, collectionProducts]);

  const destinationUrl = useMemo(() => {
    const base = (config.baseUrl || "http://localhost:3000").replace(/\/+$/, "");
    if (targetType === "product" && activeProduct) {
      return `${base}/finds/${activeProduct.slug}`;
    }
    if (targetType === "collection" && activeCollection) {
      return `${base}/collections/${activeCollection.slug}`;
    }
    return base;
  }, [config.baseUrl, targetType, activeProduct, activeCollection]);

  const copyVariations = useMemo(() => {
    if (targetType === "product" && activeProduct) {
      return generateProductPinCopy(activeProduct);
    }
    if (targetType === "collection" && activeCollection) {
      return generateCollectionPinCopy(activeCollection, collectionProducts);
    }
    return [];
  }, [targetType, activeProduct, activeCollection, collectionProducts]);

  useEffect(() => {
    let cancelled = false;
    const offscreen = document.createElement("canvas");
    void renderPinToCanvas(offscreen, {
      template,
      theme,
      headline: effectiveHeadline,
      badgeText: effectiveBadge,
      footerLabel: config.siteName,
      imageUrls,
    }).then(() => {
      if (cancelled || !canvasRef.current) return;
      canvasRef.current.width = offscreen.width;
      canvasRef.current.height = offscreen.height;
      const ctx = canvasRef.current.getContext("2d");
      ctx?.drawImage(offscreen, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [
    template,
    theme,
    effectiveHeadline,
    effectiveBadge,
    config.siteName,
    imageUrls,
  ]);

  function handleDownloadPng() {
    if (!canvasRef.current) return;
    const slug =
      targetType === "product"
        ? activeProduct?.slug || "pin"
        : activeCollection?.slug || "collection-pin";
    const link = document.createElement("a");
    link.download = `${slug}-pinterest-1000x1500.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left: Controls + Copy Generator */}
      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-6 space-y-5 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C25E3A]" />
            <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
              1. Chọn nội dung &amp; tùy chỉnh ảnh Pin (1000×1500px)
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#4F463F]">
                Loại bài đăng
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("product");
                    setTargetId(products[0]?.id ?? "");
                    setTemplate("editorial");
                    setCustomHeadline("");
                    setCustomBadge("");
                  }}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    targetType === "product"
                      ? "bg-[#1F1B18] text-white"
                      : "border border-[#E6DCCF] bg-[#FAF7F2] text-[#4F463F]"
                  }`}
                >
                  Sản phẩm lẻ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("collection");
                    setTargetId(collections[0]?.id ?? "");
                    setTemplate("listicle-collage");
                    setCustomHeadline("");
                    setCustomBadge("");
                  }}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    targetType === "collection"
                      ? "bg-[#1F1B18] text-white"
                      : "border border-[#E6DCCF] bg-[#FAF7F2] text-[#4F463F]"
                  }`}
                >
                  Bộ sưu tập
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4F463F]">
                Chọn {targetType === "product" ? "sản phẩm" : "bộ sưu tập"}
              </label>
              <select
                value={targetId}
                onChange={(e) => {
                  setTargetId(e.target.value);
                  setCustomHeadline("");
                  setCustomBadge("");
                }}
                className="mt-1.5 w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2 text-xs"
              >
                {targetType === "product"
                  ? products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))
                  : collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4F463F]">
              Mẫu bố cục ảnh Pin
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    template === t.id
                      ? "border-[#C25E3A] bg-[#FFF8F4]"
                      : "border-[#E6DCCF] bg-white hover:border-[#C25E3A]/50"
                  }`}
                >
                  <p className="text-xs font-semibold text-[#1F1B18]">
                    {t.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#665B52]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#4F463F]">
                Chữ tiêu đề trên ảnh (tùy chỉnh)
              </label>
              <input
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                placeholder={effectiveHeadline}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4F463F]">
                Nhãn nhỏ phía trên (Badge)
              </label>
              <input
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder={effectiveBadge}
                className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4F463F]">
              Bảng màu
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    theme === t.id
                      ? "border-[#1F1B18] bg-[#1F1B18] text-white"
                      : "border-[#E6DCCF] bg-white text-[#4F463F]"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/15"
                    style={{ backgroundColor: t.swatch }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination URL box */}
          <div className="rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4D6B57]">
              Link đích để dán vào ô &quot;Destination Link&quot; trên Pinterest
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-white px-2.5 py-1.5 text-xs text-[#1F1B18] border border-[#E6DCCF]">
                {destinationUrl}
              </code>
              <button
                type="button"
                onClick={() => copyText("dest-url", destinationUrl)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1F1B18] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3A332E]"
              >
                {copiedKey === "dest-url" ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Đã copy
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3 US-English Pinterest Copy Variations */}
        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
              2. Nội dung tiếng Anh chuẩn SEO Pinterest (3 phương án)
            </h2>
            <p className="text-xs text-[#665B52]">
              Chọn 1 trong 3 mẫu bên dưới để copy dán thẳng khi đăng Pin lên Pinterest Mỹ.
            </p>
          </div>

          <div className="space-y-4">
            {copyVariations.map((v, idx) => {
              const fullDescription = `${v.description}\n\n${v.hashtags.join(" ")}`;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-4 space-y-2.5 text-xs"
                >
                  <p className="font-semibold text-[#C25E3A]">{v.angle}</p>

                  <div className="flex items-start justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#EFE6DA]">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#7A6E64]">
                        Pin Title ({v.title.length}/100)
                      </span>
                      <p className="mt-0.5 font-semibold text-[#1F1B18]">
                        {v.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(`t-${idx}`, v.title)}
                      className="shrink-0 rounded-lg border border-[#E6DCCF] px-2.5 py-1 text-[11px] font-semibold hover:border-[#C25E3A]"
                    >
                      {copiedKey === `t-${idx}` ? "Đã copy!" : "Copy"}
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#EFE6DA]">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#7A6E64]">
                        Pin Description + Hashtags
                      </span>
                      <p className="mt-0.5 whitespace-pre-line text-[#4F463F]">
                        {fullDescription}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(`d-${idx}`, fullDescription)}
                      className="shrink-0 rounded-lg border border-[#E6DCCF] px-2.5 py-1 text-[11px] font-semibold hover:border-[#C25E3A]"
                    >
                      {copiedKey === `d-${idx}` ? "Đã copy!" : "Copy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Live 1000x1500 Canvas Preview + Download */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-[#E6DCCF] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#1F1B18]">
                Xem trước ảnh Pin
              </h3>
              <p className="text-xs text-[#665B52]">
                Kích thước chuẩn Pinterest: 1000 × 1500 px (2:3)
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C25E3A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#A54B2B]"
            >
              <Download className="h-4 w-4" />
              Tải ảnh PNG
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E6DCCF] bg-[#F2EBE0] p-3 flex justify-center">
            <canvas
              ref={canvasRef}
              className="w-full max-w-[360px] h-auto rounded-xl shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
