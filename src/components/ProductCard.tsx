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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#E6DCCF] bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/finds/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-[#F5EFE6]"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-[#1F1B18]/90 px-3 py-1 text-[11px] font-semibold text-[#FAF7F2]">
          {product.badge}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4D6B57]">
          {CATEGORY_LABELS[product.category]}
        </p>

        <Link
          href={`/finds/${product.slug}`}
          className="mt-1.5 font-display text-lg font-semibold leading-snug text-[#1F1B18] group-hover:text-[#C25E3A] transition"
        >
          {product.title}
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#665B52]">
          {product.shortPitch}
        </p>

        <div className="mt-auto pt-5 flex flex-col gap-2">
          <AffiliateButton
            href={product.affiliateUrl}
            productSlug={product.slug}
            productTitle={product.title}
            sourcePage={sourcePage}
            size="sm"
            className="w-full"
          />
          <Link
            href={`/finds/${product.slug}`}
            className="text-center text-xs font-medium text-[#665B52] hover:text-[#1F1B18] py-1"
          >
            Read full notes →
          </Link>
        </div>
      </div>
    </article>
  );
}
