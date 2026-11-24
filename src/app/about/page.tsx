import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/storage";

export const metadata: Metadata = {
  title: "About Us",
  description: "How we curate practical Amazon home & kitchen organization finds.",
};

export default function AboutPage() {
  const config = readSiteConfig();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4D6B57]">
        About {config.siteName}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-[#1F1B18] sm:text-4xl">
        Practical Home &amp; Kitchen Finds, Curated Without the Clutter
      </h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4F463F]">
        <p>
          Welcome to <strong>{config.siteName}</strong>. We spotlight clever,
          renter-friendly home and kitchen organization tools designed to make
          daily cooking, tidying, and small-space living calmer and easier.
        </p>
        <p>
          Scrolling through thousands of nearly identical listings on Amazon is
          exhausting. Our mission is simple: narrow down standout organizers,
          pantry upgrades, and compact bathroom solutions based on practical
          everyday utility, build quality, and verified shopper feedback.
        </p>
        <p>
          Every find we feature links straight to Amazon so you can check live
          pricing, current color options, and up-to-date customer reviews before
          deciding.
        </p>
      </div>
    </div>
  );
}
