"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import type { Product, ProductCategory, SiteConfig } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { AffiliateButton } from "./AffiliateButton";

interface LinksHubProps {
  config: SiteConfig;
  products: Product[];
}

export function LinksHub({ config, products }: LinksHubProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");

  const indexed = useMemo(
    () =>
      products.map((product, i) => ({
        product,
        code: `#${String(i + 1).padStart(2, "0")}`,
      })),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indexed.filter(({ product, code }) => {
      if (category !== "all" && product.category !== category) return false;
      if (!q) return true;
      const numericQ = q.replace(/^#/, "");
      return (
        code.toLowerCase().includes(q) ||
        code.replace(/^#/, "").includes(numericQ) ||
        product.title.toLowerCase().includes(q) ||
        product.shortPitch.toLowerCase().includes(q) ||
        CATEGORY_LABELS[product.category].toLowerCase().includes(q)
      );
    });
  }, [indexed, query, category]);

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-20">
      {/* Compact Mobile-First Profile Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
          <Sparkles className="h-3.5 w-3.5" />
          As Seen on TikTok, Reels &amp; Pinterest
        </span>
        <h1 className="mt-3 font-display text-3xl font-normal text-[var(--color-ink)]">
          {config.siteName}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-ink-2)]">
          Tap any find below — or search by{" "}
          <strong className="font-semibold text-[var(--color-ink)]">#number</strong>{" "}
          from our videos.
        </p>
      </div>

      {/* Instant Search Bar */}
      <div className="mt-6 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search #01, air fryer, shower caddy, fridge..."
          className="w-full rounded-2xl border border-[var(--color-rule)] bg-[var(--color-light)] py-3 pl-10 pr-4 text-sm text-[var(--color-ink)] shadow-sm focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {(
          [
            ["all", `All (${products.length})`],
            ["kitchen", "Kitchen"],
            ["pantry", "Pantry"],
            ["bathroom", "Bathroom"],
            ["organization", "Organization"],
          ] as const
        ).map(([key, label]) => {
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-[var(--color-ink)] text-white"
                  : "border border-[var(--color-rule)] bg-[var(--color-light)] text-[var(--color-ink-2)] hover:border-[var(--color-ink)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 1-Tap Product Link Cards */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="refract-card p-8 text-center text-sm text-[var(--color-muted)]">
            No finds match &ldquo;{query}&rdquo;. Try another keyword or clear
            the filter.
          </div>
        ) : (
          filtered.map(({ product, code }) => (
            <div
              key={product.id}
              className="refract-card flex items-center gap-3.5 p-3 transition hover:-translate-y-0.5"
            >
              <Link
                href={`/finds/${product.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--color-paper-2)]"
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-1 top-1 rounded-md bg-[var(--color-ink)]/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  {code}
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                    {product.badge}
                  </span>
                  {product.ratingLabel ? (
                    <span className="text-[11px] font-medium text-[#9A5B13]">
                      {product.ratingLabel}
                    </span>
                  ) : null}
                </div>

                <Link
                  href={`/finds/${product.slug}`}
                  className="mt-1 block line-clamp-2 text-sm font-medium leading-snug text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  {product.title}
                </Link>

                <div className="mt-2 flex items-center gap-2">
                  <AffiliateButton
                    href={product.affiliateUrl}
                    productSlug={product.slug}
                    productTitle={product.title}
                    sourcePage="links-bio"
                    size="sm"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
        {config.disclosureText}
      </p>
    </div>
  );
}
