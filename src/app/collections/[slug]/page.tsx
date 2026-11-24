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
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#665B52] hover:text-[#C25E3A] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-6">
        <span className="inline-block rounded-full bg-[#EAEFE9] px-3 py-1 text-xs font-semibold text-[#4D6B57]">
          Curated Guide • {items.length} Picks
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#1F1B18] sm:text-4xl">
          {collection.title}
        </h1>
        <p className="mt-3 text-lg text-[#5E534A]">{collection.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#665B52]">
          {collection.intro}
        </p>

        <div className="mt-5 rounded-xl border border-[#E6DCCF] bg-[#F2EBE0]/60 px-4 py-3 text-xs text-[#665B52]">
          <strong>Disclosure:</strong> {config.disclosureText}
        </div>
      </header>

      <div className="mt-10 space-y-8">
        {items.map((product, index) => (
          <section
            key={product.id}
            className="overflow-hidden rounded-3xl border border-[#E6DCCF] bg-white shadow-xs"
          >
            <div className="grid md:grid-cols-5">
              <Link
                href={`/finds/${product.slug}`}
                className="relative aspect-square bg-[#F5EFE6] md:col-span-2 md:aspect-auto"
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1B18] font-display text-sm font-semibold text-white">
                  #{index + 1}
                </span>
              </Link>

              <div className="flex flex-col justify-between p-6 md:col-span-3">
                <div>
                  <span className="inline-block rounded-full bg-[#FAF7F2] border border-[#E6DCCF] px-2.5 py-0.5 text-[11px] font-semibold text-[#C25E3A]">
                    {product.badge}
                  </span>
                  <Link
                    href={`/finds/${product.slug}`}
                    className="mt-2 block font-display text-2xl font-semibold text-[#1F1B18] hover:text-[#C25E3A] transition"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-2 text-sm leading-relaxed text-[#5E534A]">
                    {product.shortPitch}
                  </p>

                  {product.highlights.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {product.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-[#4F463F]"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4D6B57]" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <AffiliateButton
                    href={product.affiliateUrl}
                    productSlug={product.slug}
                    productTitle={product.title}
                    sourcePage={`collection:${collection.slug}`}
                  />
                  <Link
                    href={`/finds/${product.slug}`}
                    className="text-xs font-medium text-[#665B52] hover:text-[#1F1B18]"
                  >
                    Full details →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
