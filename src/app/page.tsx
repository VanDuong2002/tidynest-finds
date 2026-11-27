import Link from "next/link";
import {
  readCollections,
  readProducts,
  readSiteConfig,
} from "@/lib/storage";
import { RefractCaustics } from "@/components/RefractCaustics";
import { HeroTodayCard } from "@/components/HeroTodayCard";
import { HomeDiscovery } from "@/components/HomeDiscovery";

export default function HomePage() {
  const config = readSiteConfig();
  const products = readProducts();
  const collections = readCollections();

  const ranked = [...products].sort(
    (a, b) =>
      Number(a.isSample) - Number(b.isSample) ||
      Number(b.featured) - Number(a.featured)
  );

  return (
    <div>
      {/* Signature Refract Split Hero: Sunlit Paper Left + Tiled Caustic Pool Right */}
      <section className="relative -mt-20 min-h-[720px] overflow-x-clip pt-28 pb-16 lg:flex lg:min-h-[92svh] lg:items-center lg:py-0">
        {/* Right-half Aqua Caustic Pool Basin extending behind the floating navbar */}
        <div
          aria-hidden="true"
          className="refract-pool pointer-events-none absolute inset-y-0 right-0 left-0 hidden overflow-hidden rounded-bl-[36px] lg:left-[47%] lg:bottom-12 lg:block"
        >
          <RefractCaustics />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1360px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-14">
          {/* Left 5 Columns: Crisp Funnel Display Headline & Pill CTAs */}
          <div className="lg:col-span-5 lg:pr-6">
            <Link
              href="/collections/best-amazon-home-kitchen-gift-ideas-holiday"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-light)]/90 px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              Season&apos;s Top 5 Viral Amazon Home Gifts →
            </Link>

            <h1 className="font-display text-[3rem] font-normal leading-[1.03] text-[var(--color-ink)] sm:text-[4rem] lg:text-[4.65rem]">
              Tidy spaces,
              <br />
              every day.
            </h1>

            <p className="mt-6 max-w-md text-[1.0625rem] leading-[1.55] text-[var(--color-ink-2)]">
              {config.tagline}. Practical Amazon home and kitchen finds curated
              for calmer counters and clutter-free living.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/#finds" className="refract-btn text-sm">
                Explore finds
              </Link>
              <Link href="/#collections" className="refract-btn-clear text-sm">
                See reset guides
              </Link>
            </div>

            <p className="mt-7 text-xs text-[var(--color-muted)]">
              Hand-picked Amazon US favorites, updated weekly.
            </p>
          </div>

          {/* Right 7 Columns: Floating Interactive Today's Edit Card over Caustic Basin */}
          <div className="lg:col-span-7 lg:flex lg:justify-center lg:pl-8">
            <div className="refract-pool relative overflow-hidden rounded-[28px] p-4 sm:p-6 lg:bg-none lg:p-0 lg:shadow-none">
              <div className="absolute inset-0 lg:hidden">
                <RefractCaustics />
              </div>
              <HeroTodayCard
                products={ranked}
                totalProducts={products.length}
                totalCollections={collections.length}
              />
            </div>
          </div>
        </div>
      </section>

      <HomeDiscovery products={products} collections={collections} />
    </div>
  );
}
