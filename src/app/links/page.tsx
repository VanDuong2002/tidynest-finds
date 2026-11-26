import type { Metadata } from "next";
import { readProducts, readSiteConfig } from "@/lib/storage";
import { LinksHub } from "@/components/LinksHub";

export async function generateMetadata(): Promise<Metadata> {
  const config = readSiteConfig();
  return {
    title: `Shop Our Video Finds`,
    description: `All curated Amazon Home & Kitchen finds from ${config.siteName} — search by #number from TikTok, Reels, Shorts, and Pinterest.`,
  };
}

export default function LinksPage() {
  const config = readSiteConfig();
  const products = readProducts();
  const realProducts = products.filter((p) => !p.isSample);
  const displayProducts = realProducts.length > 0 ? realProducts : products;

  return <LinksHub config={config} products={displayProducts} />;
}
