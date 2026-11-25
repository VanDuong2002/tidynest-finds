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
    .sort(
      (a, b) =>
        Number(b.category === product.category) -
        Number(a.category === product.category)
    )
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-20 sm:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all finds
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="refract-card overflow-hidden p-3 lg:sticky lg:top-24 lg:col-span-6">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="aspect-square w-full rounded-[14px] bg-[var(--color-paper-2)] object-cover"
          />
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className="rounded-full border border-[var(--color-rule)] bg-[var(--color-light)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]">
              {product.badge}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-[var(--color-ink)] sm:text-[2.75rem]">
            {product.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-2)]">
            {product.shortPitch}
          </p>

          {product.highlights.length > 0 ? (
            <div className="refract-card mt-7 p-6">
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Why people love it
              </h2>
              <ul className="mt-4 divide-y divide-[var(--color-rule-2)]">
                {product.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 py-3 text-sm leading-relaxed text-[var(--color-ink-2)] first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8">
            <AffiliateButton
              href={product.affiliateUrl}
              productSlug={product.slug}
              productTitle={product.title}
              sourcePage={`find:${product.slug}`}
              size="lg"
              className="w-full sm:w-auto"
            />
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
              {config.disclosureText} Clicking takes you directly to Amazon to
              check live pricing, verified reviews, and current stock.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24 border-t border-[var(--color-rule)] pt-14">
          <h2 className="font-display text-2xl font-normal text-[var(--color-ink)] sm:text-3xl">
            More finds you might like
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
