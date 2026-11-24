import Link from "next/link";
import { Sparkles, Wrench } from "lucide-react";
import type { SiteConfig } from "@/lib/types";

interface SiteHeaderProps {
  config: SiteConfig;
  showStudioLink: boolean;
}

export function SiteHeader({ config, showStudioLink }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E6DCCF] bg-[#FAF7F2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C25E3A] text-white shadow-sm transition group-hover:bg-[#A54B2B]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <span className="font-display text-lg font-semibold tracking-tight text-[#1F1B18] block leading-none">
              {config.siteName}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#7A6E64]">
              Home &amp; Kitchen Edit
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-[#4F463F]">
          <Link href="/#finds" className="hover:text-[#C25E3A] transition">
            Finds
          </Link>
          <Link href="/#collections" className="hover:text-[#C25E3A] transition">
            Collections
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline hover:text-[#C25E3A] transition"
          >
            About
          </Link>
          {config.pinterestUrl ? (
            <a
              href={config.pinterestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center rounded-full border border-[#E6DCCF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F1B18] hover:border-[#C25E3A] hover:text-[#C25E3A] transition"
            >
              Follow on Pinterest
            </a>
          ) : null}
          {showStudioLink ? (
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1F1B18] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3A332E] transition"
            >
              <Wrench className="h-3.5 w-3.5" />
              Mở Studio
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
