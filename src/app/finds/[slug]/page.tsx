import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { readProducts, readSiteConfig } from "@/lib/storage";
import { CATEGORY_LABELS } from "@/lib/types";
import { AffiliateButton } from "@/components/AffiliateButton";
import { ProductCard } from "@/components/ProductCard";

export function generateStaticParams() {
  return readProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = readProducts().find((p) => p.slug === slug);
  if (!product) return { title: "Find Not Found" };

  return {
    title: product.title,
    description: product.shortPitch,
    openGraph: {
      title: product.title,
      description: product.shortPitch,
      images: [product.imageUrl],
      type: "article",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = readProducts();
  const config = readSiteConfig();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const related = products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#665B52] hover:text-[#C25E3A] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all finds
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-3xl border border-[#E6DCCF] bg-white shadow-xs">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EAEFE9] px-3 py-1 text-xs font-semibold text-[#4D6B57]">
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className="rounded-full bg-[#1F1B18] px-3 py-1 text-xs font-semibold text-[#FAF7F2]">
              {product.badge}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#1F1B18] sm:text-4xl">
            {product.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#5E534A]">
            {product.shortPitch}
          </p>

          {product.highlights.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-[#E6DCCF] bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#4D6B57]">
                Why People Love It
              </h2>
              <ul className="mt-3 space-y-2.5">
                {product.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-[#352E29]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAEFE9] text-[#4D6B57]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-7">
            <AffiliateButton
              href={product.affiliateUrl}
              productSlug={product.slug}
              productTitle={product.title}
              sourcePage={`find:${product.slug}`}
              size="lg"
              className="w-full sm:w-auto"
            />
            <p className="mt-3 text-xs leading-relaxed text-[#7A6E64]">
              {config.disclosureText} Clicking this button takes you directly to
              Amazon to check current availability, reviews, and live pricing.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-[#E6DCCF] pt-12">
          <h2 className="font-display text-2xl font-semibold text-[#1F1B18]">
            More Finds You Might Like
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                sourcePage={`related:${product.slug}`}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
