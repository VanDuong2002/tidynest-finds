"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  FolderKanban,
  Loader2,
  Package,
  Rocket,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import type {
  AnalyticsEntry,
  Collection,
  Product,
  SiteConfig,
} from "@/lib/types";
import { AutomationTab } from "./AutomationTab";
import { ProductsTab } from "./ProductsTab";
import { CollectionsTab } from "./CollectionsTab";
import { PinStudioTab } from "./PinStudioTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { SettingsTab } from "./SettingsTab";

type StudioTabId =
  | "automation"
  | "products"
  | "collections"
  | "pin-studio"
  | "analytics"
  | "settings";

interface StudioWorkspaceProps {
  initialConfig: SiteConfig;
  initialProducts: Product[];
  initialCollections: Collection[];
  initialAnalytics: AnalyticsEntry[];
}

export function StudioWorkspace({
  initialConfig,
  initialProducts,
  initialCollections,
  initialAnalytics,
}: StudioWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<StudioTabId>("automation");
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [collections, setCollections] =
    useState<Collection[]>(initialCollections);
  const [analytics, setAnalytics] =
    useState<AnalyticsEntry[]>(initialAnalytics);
  const [pinTarget, setPinTarget] = useState<{
    type: "product" | "collection";
    id: string;
  } | null>(null);
  const [quickPublishing, setQuickPublishing] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Auto-import payload sent from 1-Click Amazon Bookmarklet (?import=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rawImport = params.get("import");
    if (!rawImport) return;

    window.history.replaceState({}, "", "/studio");
    (async () => {
      try {
        const parsed = JSON.parse(rawImport);
        setBannerMsg({
          type: "ok",
          text: "Đang tự động nhập sản phẩm từ Bookmarklet Amazon...",
        });
        const res = await fetch("/api/studio/import-amazon", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...parsed,
            autoSave: true,
            downloadImage: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.saved && data.products) {
          setProducts(data.products);
          setBannerMsg({
            type: "ok",
            text: `✓ Đã tự động thêm "${data.product.title}" + tải ảnh + gắn affiliate tag! Bấm "Xuất bản lên Web" để đẩy lên Vercel.`,
          });
        } else {
          setBannerMsg({
            type: "err",
            text: data.error || data.message || "Không thể nhập sản phẩm.",
          });
        }
      } catch {
        setBannerMsg({
          type: "err",
          text: "Dữ liệu từ Bookmarklet không hợp lệ.",
        });
      }
    })();
  }, []);

  async function handleQuickPublish() {
    setQuickPublishing(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setBannerMsg({
        type: res.ok ? "ok" : "err",
        text: res.ok ? data.message : data.error || "Xuất bản thất bại.",
      });
    } finally {
      setQuickPublishing(false);
    }
  }

  const tabs: {
    id: StudioTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "automation", label: "Tự động hóa 1-Click", icon: Zap },
    { id: "products", label: `Sản phẩm (${products.length})`, icon: Package },
    {
      id: "collections",
      label: `Bộ sưu tập (${collections.length})`,
      icon: FolderKanban,
    },
    { id: "pin-studio", label: "Xưởng Pin 1000×1500", icon: Sparkles },
    { id: "analytics", label: "Báo cáo & Hoa hồng", icon: BarChart3 },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6DCCF] bg-[#1F1B18] px-6 py-5 text-white">
        <div>
          <span className="inline-block rounded-full bg-[#C25E3A] px-2.5 py-0.5 text-[11px] font-semibold">
            Chế độ nội bộ (chỉ chạy trên máy bạn)
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            Xưởng Quản Trị Affiliate — {config.siteName}
          </h1>
          <p className="mt-0.5 text-xs text-[#D5C9BC]">
            Thêm sản phẩm Amazon US, tạo ảnh Pin dọc 1000×1500 và theo dõi
            traffic, chuyển đổi, hoa hồng thực nhận.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleQuickPublish}
            disabled={quickPublishing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#B84A27] px-4 py-2 text-xs font-semibold text-white hover:bg-[#993B1D] transition disabled:opacity-50"
          >
            {quickPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            {quickPublishing ? "Đang đẩy lên Web..." : "Xuất bản lên Web"}
          </button>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            Xem trang Web công khai
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {bannerMsg ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-xs font-medium ${
            bannerMsg.type === "ok"
              ? "bg-[#EAEFE9] text-[#2F523B] border border-[#C6D8C8]"
              : "bg-[#FDECEC] text-[#9F2A2A] border border-[#F3C6C6]"
          }`}
        >
          {bannerMsg.text}
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E6DCCF] pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                active
                  ? "bg-[#C25E3A] text-white shadow-sm"
                  : "border border-[#E6DCCF] bg-white text-[#4F463F] hover:border-[#C25E3A] hover:text-[#C25E3A]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="mt-6">
        {activeTab === "automation" ? (
          <AutomationTab
            config={config}
            products={products}
            onProductsChange={setProducts}
            onConfigChange={setConfig}
          />
        ) : null}

        {activeTab === "products" ? (
          <ProductsTab
            products={products}
            onProductsChange={(nextProducts, nextCollections) => {
              setProducts(nextProducts);
              if (nextCollections) setCollections(nextCollections);
            }}
            onCreatePinForProduct={(id) => {
              setPinTarget({ type: "product", id });
              setActiveTab("pin-studio");
            }}
          />
        ) : null}

        {activeTab === "collections" ? (
          <CollectionsTab
            collections={collections}
            products={products}
            onCollectionsChange={setCollections}
            onCreatePinForCollection={(id) => {
              setPinTarget({ type: "collection", id });
              setActiveTab("pin-studio");
            }}
          />
        ) : null}

        {activeTab === "pin-studio" ? (
          <PinStudioTab
            config={config}
            products={products}
            collections={collections}
            initialTarget={pinTarget}
          />
        ) : null}

        {activeTab === "analytics" ? (
          <AnalyticsTab
            entries={analytics}
            products={products}
            usdToVndRate={config.usdToVndRate}
            amazonAssociateTag={config.amazonAssociateTag}
            onEntriesChange={setAnalytics}
            onProductsChange={setProducts}
          />
        ) : null}

        {activeTab === "settings" ? (
          <SettingsTab config={config} onConfigChange={setConfig} />
        ) : null}
      </div>
    </div>
  );
}
