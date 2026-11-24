import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import {
  readCollections,
  readProducts,
  readSiteConfig,
} from "@/lib/storage";
import { HomeDiscovery } from "@/components/HomeDiscovery";

export default function HomePage() {
  const config = readSiteConfig();
  const products = readProducts();
  const collections = readCollections();

  return (
    <div>
      <section className="border-b border-[#E6DCCF] bg-gradient-to-b from-[#F4ECE1] to-[#FAF7F2]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DFD1BE] bg-white px-3.5 py-1 text-xs font-semibold text-[#C25E3A]">
              <Sparkles className="h-3.5 w-3.5" />
              Curated Amazon US Home &amp; Kitchen Edit
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-[#1F1B18] sm:text-5xl">
              {config.tagline}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5E534A] sm:text-lg">
              Practical, renter-friendly organizers and clever kitchen tools we
              curate for calmer countertops, tidier pantries, and smarter small
              spaces.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/#finds"
                className="rounded-xl bg-[#1F1B18] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3A332E] transition"
              >
                Explore All Finds
              </Link>
              <Link
                href="/#collections"
                className="rounded-xl border border-[#D8CBB9] bg-white px-5 py-3 text-sm font-semibold text-[#1F1B18] hover:border-[#C25E3A] hover:text-[#C25E3A] transition"
              >
                Browse Top Lists
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#665B52]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#4D6B57]" />
                Renter-friendly &amp; practical
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#4D6B57]" />
                Hand-picked Amazon US favorites
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#4D6B57]" />
                No fluff, just clutter-clearing finds
              </span>
            </div>
          </div>
        </div>
      </section>

      <HomeDiscovery products={products} collections={collections} />
    </div>
  );
}
