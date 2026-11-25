"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import type { Collection, Product, ProductCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type FilterValue = "all" | ProductCategory | "under-25";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All finds" },
  { value: "kitchen", label: CATEGORY_LABELS.kitchen },
  { value: "pantry", label: CATEGORY_LABELS.pantry },
  { value: "bathroom", label: CATEGORY_LABELS.bathroom },
  { value: "organization", label: CATEGORY_LABELS.organization },
  { value: "under-25", label: "Under $25" },
];

export function HomeDiscovery({
  products,
  collections,
}: {
  products: Product[];
  collections: Collection[];
}) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "under-25"
            ? p.badge === "Under $25"
            : p.category === activeFilter;

      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.shortPitch.toLowerCase().includes(q) ||
        p.highlights.some((h) => h.toLowerCase().includes(q));

      return matchesFilter && matchesQuery;
    });
  }, [products, activeFilter, query]);

  return (
    <>
      {/* Curated Archive Section */}
      <section
        id="finds"
        className="mx-auto max-w-[1360px] px-5 pt-12 pb-24 sm:px-8 lg:px-14"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-normal text-[var(--color-ink)] sm:text-[2.75rem] sm:leading-[1.08]">
              Finds, room by room
            </h2>
            <p className="mt-2 max-w-xl text-base text-[var(--color-ink-2)]">
              Clean, functional organizers chosen to clear kitchen counters,
              pantries, and small spaces.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizers, pantry..."
              className="w-full rounded-full border border-[var(--color-rule)] bg-[var(--color-light)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        </div>

        {/* Refract Segmented Pill Control on --color-paper-2 */}
        <div className="mt-7 inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-1 sm:rounded-full">
          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? "bg-[var(--color-ink)] text-[var(--color-accent-ink)]"
                    : "text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="refract-card mt-10 p-12 text-center">
            <p className="font-display text-xl text-[var(--color-ink)]">
              No matching finds yet
            </p>
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
              Try switching categories or clearing your search term.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sourcePage="home"
              />
            ))}
          </div>
        )}
      </section>

      {/* Room Reset Guides Band on --color-paper-2 */}
      {collections.length > 0 ? (
        <section
          id="collections"
          className="border-y border-[var(--color-rule)] bg-[var(--color-paper-2)] py-24"
        >
          <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-14">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-normal text-[var(--color-ink)] sm:text-[2.75rem] sm:leading-[1.08]">
                Weekend reset guides
              </h2>
              <p className="mt-2 text-base text-[var(--color-ink-2)]">
                Curated multi-item lists built to reorganize an entire room in
                one afternoon.
              </p>
            </div>

            <div className="mt-10 grid gap-7 md:grid-cols-2">
              {collections.map((col, idx) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="refract-card group grid overflow-hidden p-3.5 transition-transform duration-300 hover:-translate-y-0.5 sm:grid-cols-5 sm:gap-5"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-[12px] bg-[var(--color-paper-2)] sm:col-span-2 sm:aspect-auto">
                    <img
                      src={col.coverImageUrl}
                      alt={col.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-col justify-between px-1.5 pt-4 pb-1 sm:col-span-3 sm:py-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                          {col.productIds.length} picks
                        </span>
                        <span className="font-display text-sm font-light tabular-nums text-[var(--color-muted)]">
                          0{idx + 1}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-normal leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
                        {col.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-2)]">
                        {col.subtitle}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
                      Open guide
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
