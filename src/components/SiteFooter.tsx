import Link from "next/link";
import type { SiteConfig } from "@/lib/types";

export function SiteFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="bg-[var(--color-paper)] pt-20 pb-14">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-14">
        {/* Signature Refract Oversized Light-Weight Statement */}
        <p className="font-display text-[2.75rem] font-light leading-[1.02] text-[var(--color-ink)] sm:text-[4.25rem] lg:text-[5.5rem]">
          Make room for calm.
        </p>

        <div className="mt-12 flex flex-col gap-6 border-t border-[var(--color-rule)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-ink-2)]">
            <Link
              href="/#finds"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              Finds
            </Link>
            <Link
              href="/#collections"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              Guides
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              About
            </Link>
            <Link
              href="/disclosure"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              Disclosure
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              Privacy
            </Link>
            <a
              href="/rss.xml"
              className="transition-colors hover:text-[var(--color-ink)]"
            >
              RSS Feed
            </a>
          </div>

          <p className="text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} {config.siteName}
          </p>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[var(--color-muted)]">
          <strong className="font-medium text-[var(--color-ink-2)]">
            Affiliate Disclosure:
          </strong>{" "}
          {config.disclosureText} Product prices and availability are accurate as
          of the date/time indicated on Amazon and are subject to change.
        </p>
      </div>
    </footer>
  );
}
