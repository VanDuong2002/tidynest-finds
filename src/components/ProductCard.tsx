import Link from "next/link";
import type { Product } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { AffiliateButton } from "./AffiliateButton";

export function ProductCard({
  product,
  sourcePage = "home",
}: {
  product: Product;
  sourcePage?: string;
}) {
  return (
    <article className="refract-card group flex flex-col overflow-hidden p-3.5 transition-transform duration-300 hover:-translate-y-0.5">
      <Link
        href={`/finds/${product.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-[var(--color-paper-2)]"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--color-light)]/92 px-3 py-1 text-xs font-medium text-[var(--color-ink)]">
          {product.badge}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-1.5 pt-4 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]">
            {CATEGORY_LABELS[product.category]}
          </span>
          <Link
            href={`/finds/${product.slug}`}
            className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            Details →
          </Link>
        </div>

        <Link
          href={`/finds/${product.slug}`}
          className="mt-2.5 font-display text-[1.2rem] font-normal leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]"
        >
          {product.title}
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-2)]">
          {product.shortPitch}
        </p>

        <div className="mt-auto pt-4">
          <AffiliateButton
            href={product.affiliateUrl}
            productSlug={product.slug}
            productTitle={product.title}
            sourcePage={sourcePage}
            size="sm"
            className="w-full"
          />
        </div>
      </div>
    </article>
  );
}
