"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  FolderKanban,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";
import type {
  AnalyticsEntry,
  Collection,
  Product,
  SiteConfig,
} from "@/lib/types";
import { ProductsTab } from "./ProductsTab";
import { CollectionsTab } from "./CollectionsTab";
import { PinStudioTab } from "./PinStudioTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { SettingsTab } from "./SettingsTab";

type StudioTabId =
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
  const [activeTab, setActiveTab] = useState<StudioTabId>("products");
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

  const tabs: {
    id: StudioTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "products", label: `Sản phẩm (${products.length})`, icon: Package },
    {
      id: "collections",
      label: `Bộ sưu tập (${collections.length})`,
      icon: FolderKanban,
    },
    { id: "pin-studio", label: "Xưởng Pin 1000×1500", icon: Sparkles },
    { id: "analytics", label: "Báo cáo & Hoa hồng", icon: BarChart3 },
    { id: "settings", label: "Cài đặt & Xuất bản", icon: Settings },
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

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
        >
          Xem trang Web công khai
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

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
        {activeTab === "products" ? (
          <ProductsTab
            products={products}
            onProductsChange={setProducts}
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
            onEntriesChange={setAnalytics}
          />
        ) : null}

        {activeTab === "settings" ? (
          <SettingsTab config={config} onConfigChange={setConfig} />
        ) : null}
      </div>
    </div>
  );
}
