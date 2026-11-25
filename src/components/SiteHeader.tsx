import Link from "next/link";
import { Wrench } from "lucide-react";
import type { SiteConfig } from "@/lib/types";

interface SiteHeaderProps {
  config: SiteConfig;
  showStudioLink: boolean;
}

export function SiteHeader({ config, showStudioLink }: SiteHeaderProps) {
  return (
    <div className="sticky top-4 z-40 mx-auto w-full max-w-[880px] px-4">
      <header className="refract-nav-pill flex h-16 items-center justify-between rounded-full px-4 sm:px-5">
        <Link href="/" className="group flex items-center gap-2.5 pl-1">
          <span
            aria-hidden="true"
            className="h-[18px] w-[18px] rounded-full border-[4px] border-[var(--color-accent)] transition-transform duration-200 group-hover:scale-110"
          />
          <span className="font-display text-[1.0625rem] font-medium tracking-tight text-[var(--color-ink)]">
            {config.siteName}
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-[var(--color-ink-2)] sm:gap-6">
          <Link
            href="/#finds"
            className="transition-colors duration-150 hover:text-[var(--color-ink)]"
          >
            Finds
          </Link>
          <Link
            href="/#collections"
            className="transition-colors duration-150 hover:text-[var(--color-ink)]"
          >
            Guides
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline transition-colors duration-150 hover:text-[var(--color-ink)]"
          >
            About
          </Link>
          {config.pinterestUrl && /^https?:\/\//i.test(config.pinterestUrl) ? (
            <a
              href={config.pinterestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline transition-colors duration-150 hover:text-[var(--color-ink)]"
            >
              Pinterest
            </a>
          ) : null}

          {showStudioLink ? (
            <Link
              href="/studio"
              className="refract-btn !min-h-[40px] !px-4 text-xs"
            >
              <Wrench className="h-3.5 w-3.5" />
              Studio
            </Link>
          ) : (
            <Link
              href="/#finds"
              className="refract-btn !min-h-[40px] !px-5 text-xs"
            >
              Browse finds
            </Link>
          )}
        </nav>
      </header>
    </div>
  );
}
