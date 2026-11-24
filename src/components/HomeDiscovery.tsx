"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { Collection, Product, ProductCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type FilterValue = "all" | ProductCategory | "under-25";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All Finds" },
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
      {collections.length > 0 ? (
        <section id="collections" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#4D6B57]">
                Curated Guides
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F1B18] sm:text-3xl">
                Popular Home Reset Collections
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E6DCCF] bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row"
              >
                <div className="aspect-[4/3] w-full shrink-0 bg-[#F5EFE6] sm:aspect-auto sm:w-44">
                  <img
                    src={col.coverImageUrl}
                    alt={col.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="inline-block rounded-full bg-[#EAEFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4D6B57]">
                      {col.productIds.length} Curated Picks
                    </span>
                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#1F1B18] group-hover:text-[#C25E3A] transition">
                      {col.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#665B52] line-clamp-2">
                      {col.subtitle}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25E3A]">
                    Browse collection <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="finds" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C25E3A]">
              Hand-Picked Favorites
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F1B18] sm:text-3xl">
              Latest Amazon Home &amp; Kitchen Finds
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A7D72]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizers, pantry, kitchen..."
              className="w-full rounded-xl border border-[#E6DCCF] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1F1B18] placeholder:text-[#9A8E83] focus:border-[#C25E3A] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#1F1B18] text-white shadow-xs"
                    : "border border-[#E6DCCF] bg-white text-[#4F463F] hover:border-[#C25E3A] hover:text-[#C25E3A]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#D8CBB9] bg-white/60 p-10 text-center">
            <p className="font-display text-lg text-[#1F1B18]">
              No matching finds yet
            </p>
            <p className="mt-1 text-sm text-[#665B52]">
              Try switching categories or clearing your search term.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} sourcePage="home" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
