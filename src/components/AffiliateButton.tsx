"use client";

import { ExternalLink } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface AffiliateButtonProps {
  href: string;
  productSlug: string;
  productTitle: string;
  sourcePage: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AffiliateButton({
  href,
  productSlug,
  productTitle,
  sourcePage,
  size = "md",
  className = "",
}: AffiliateButtonProps) {
  const sizeClasses =
    size === "lg"
      ? "px-6 py-3.5 text-base"
      : size === "sm"
        ? "px-3.5 py-2 text-xs"
        : "px-4 py-2.5 text-sm";

  function handleClick() {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        product_slug: productSlug,
        product_title: productTitle,
        source_page: sourcePage,
      });
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={handleClick}
      data-product-slug={productSlug}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#C25E3A] font-semibold text-white shadow-sm transition hover:bg-[#A54B2B] active:scale-[0.99] ${sizeClasses} ${className}`}
    >
      <span>Check Latest Price on Amazon</span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </a>
  );
}
