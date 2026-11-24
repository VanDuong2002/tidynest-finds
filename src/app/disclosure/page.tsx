import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "Amazon Associates Program affiliate disclosure.",
};

export default function DisclosurePage() {
  const config = readSiteConfig();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#C25E3A]">
        Transparency
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-[#1F1B18] sm:text-4xl">
        Affiliate Disclosure
      </h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4F463F]">
        <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5 font-medium text-[#1F1B18]">
          {config.disclosureText}
        </div>
        <p>
          <strong>{config.siteName}</strong> is a participant in the Amazon
          Services LLC Associates Program, an affiliate advertising program
          designed to provide a means for sites to earn advertising fees by
          advertising and linking to Amazon.com.
        </p>
        <p>
          When you click on a product link on this website and make a qualifying
          purchase on Amazon, we may earn a small commission at{" "}
          <strong>no extra cost to you</strong>. This helps support the time it
          takes to research, organize, and maintain our curated guides.
        </p>
        <p>
          Product prices, ratings, and availability can change frequently on
          Amazon. For that reason, we always link directly to Amazon so you can
          verify the exact current price before purchasing.
        </p>
      </div>
    </div>
  );
}
