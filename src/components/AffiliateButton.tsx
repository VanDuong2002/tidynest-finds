"use client";

import { ArrowUpRight } from "lucide-react";

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
      ? "!min-h-[52px] !px-7 text-sm"
      : size === "sm"
        ? "!min-h-[40px] !px-4 text-xs"
        : "!min-h-[46px] !px-5 text-sm";

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
      className={`refract-btn ${sizeClasses} ${className}`}
    >
      <span>Check price on Amazon</span>
      <ArrowUpRight className="h-4 w-4 shrink-0" />
    </a>
  );
}
