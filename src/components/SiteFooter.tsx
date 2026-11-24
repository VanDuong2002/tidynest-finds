import Link from "next/link";
import type { SiteConfig } from "@/lib/types";

export function SiteFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="mt-16 border-t border-[#E6DCCF] bg-[#F2EBE0]/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-[#1F1B18]">
              {config.siteName}
            </p>
            <p className="mt-1 max-w-md text-sm text-[#665B52]">
              {config.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-medium text-[#4F463F]">
            <Link href="/about" className="hover:text-[#C25E3A]">
              About Us
            </Link>
            <Link href="/disclosure" className="hover:text-[#C25E3A]">
              Affiliate Disclosure
            </Link>
            <Link href="/privacy" className="hover:text-[#C25E3A]">
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] px-4 py-3 text-xs leading-relaxed text-[#665B52]">
          <strong className="text-[#1F1B18]">Affiliate Disclosure:</strong>{" "}
          {config.disclosureText} Product prices and availability are accurate
          as of the date/time indicated on Amazon and are subject to change.
        </div>

        <p className="mt-6 text-xs text-[#8A7D72]">
          © {new Date().getFullYear()} {config.siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
