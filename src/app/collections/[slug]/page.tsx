import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import {
  readCollections,
  readProducts,
  readSiteConfig,
} from "@/lib/storage";
import { AffiliateButton } from "@/components/AffiliateButton";

export function generateStaticParams() {
  return readCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = readCollections().find((c) => c.slug === slug);
  if (!collection) return { title: "Collection Not Found" };

  return {
    title: collection.title,
    description: collection.subtitle,
    openGraph: {
      title: collection.title,
      description: collection.subtitle,
      images: [collection.coverImageUrl],
      type: "article",
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collections = readCollections();
  const products = readProducts();
  const config = readSiteConfig();
  const collection = collections.find((c) => c.slug === slug);

  if (!collection) {
    notFound();
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const items = collection.productIds
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <article className="mx-auto max-w-4xl px-5 pt-10 pb-20 sm:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <span className="inline-block rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
          Curated guide ({items.length} picks)
        </span>
        <h1 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-[var(--color-ink)] sm:text-[3rem]">
          {collection.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-2)]">
          {collection.subtitle}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {collection.intro}
        </p>

        <div className="mt-6 rounded-[14px] border border-[var(--color-rule)] bg-[var(--color-light)] px-4 py-3 text-xs text-[var(--color-muted)]">
          <strong className="font-medium text-[var(--color-ink)]">
            Disclosure:
          </strong>{" "}
          {config.disclosureText}
        </div>
      </header>

      <div className="mt-10 space-y-7">
        {items.map((product, index) => (
          <section
            key={product.id}
            className="refract-card grid gap-6 overflow-hidden p-4 sm:p-5 md:grid-cols-5 md:items-center"
          >
            <Link
              href={`/finds/${product.slug}`}
              className="relative aspect-square overflow-hidden rounded-[12px] bg-[var(--color-paper-2)] md:col-span-2"
            >
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] font-display text-xs font-medium text-[var(--color-accent-ink)]">
                0{index + 1}
              </span>
            </Link>

            <div className="flex flex-col justify-between md:col-span-3">
              <div>
                <span className="inline-block rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                  {product.badge}
                </span>
                <Link
                  href={`/finds/${product.slug}`}
                  className="mt-2.5 block font-display text-2xl font-normal leading-snug text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
                >
                  {product.title}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-2)]">
                  {product.shortPitch}
                </p>

                {product.highlights.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-[var(--color-rule-2)] pt-4">
                    {product.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-ink-2)]"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <AffiliateButton
                  href={product.affiliateUrl}
                  productSlug={product.slug}
                  productTitle={product.title}
                  sourcePage={`collection:${collection.slug}`}
                />
                <Link
                  href={`/finds/${product.slug}`}
                  className="text-xs font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                >
                  Full notes →
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
