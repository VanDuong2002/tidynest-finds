"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

interface HeroTodayCardProps {
  products: Product[];
  totalProducts: number;
  totalCollections: number;
}

export function HeroTodayCard({
  products,
  totalProducts,
  totalCollections,
}: HeroTodayCardProps) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const selected =
    products.find((p) => p.id === selectedId) || products[0] || null;

  if (!selected) return null;

  return (
    <div className="refract-clear relative z-10 w-full max-w-[460px] rounded-[22px] p-6 sm:p-7">
      {/* Header row with soft ice-blue metric tiles (Refract Water/Air chips) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.45rem] font-normal leading-tight text-[var(--color-ink)]">
            Today&apos;s edit
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Hand-picked Amazon US finds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-[12px] bg-[var(--color-accent-soft)] px-3 py-1.5 text-right">
            <span className="block text-[10px] font-medium text-[var(--color-muted)]">
              Finds
            </span>
            <span className="font-display text-sm font-medium tabular-nums text-[var(--color-ink)]">
              {String(totalProducts).padStart(2, "0")}
            </span>
          </div>
          <div className="rounded-[12px] bg-[var(--color-accent-soft)] px-3 py-1.5 text-right">
            <span className="block text-[10px] font-medium text-[var(--color-muted)]">
              Guides
            </span>
            <span className="font-display text-sm font-medium tabular-nums text-[var(--color-ink)]">
              {String(totalCollections).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Selectable Product Rows */}
      <div className="mt-5 space-y-1.5" role="radiogroup" aria-label="Featured finds">
        {products.slice(0, 4).map((item, idx) => {
          const active = item.id === selected.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedId(item.id)}
              className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors duration-150 ${
                active
                  ? "bg-[var(--color-light)] ring-[1.5px] ring-[var(--color-accent)]"
                  : "border-b border-[var(--color-rule-2)] hover:bg-[var(--color-light)]/70"
              }`}
            >
              <span className="w-7 shrink-0 font-display text-base font-light tabular-nums text-[var(--color-ink)]">
                0{idx + 1}
              </span>
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-10 w-10 shrink-0 rounded-[8px] bg-[var(--color-paper-2)] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                  {item.title}
                </p>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  {CATEGORY_LABELS[item.category]}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium ${
                  active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Selected Action Bar */}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--color-rule-2)] pt-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-light text-[var(--color-ink)]">
            {selected.badge}
          </p>
          <Link
            href={`/finds/${selected.slug}`}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Read full notes →
          </Link>
        </div>

        <a
          href={selected.affiliateUrl}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="refract-btn shrink-0 text-xs"
        >
          <span>Shop Amazon</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
