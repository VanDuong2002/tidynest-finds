import type { MetadataRoute } from "next";
import { readCollections, readProducts, readSiteConfig } from "@/lib/storage";

export default function sitemap(): MetadataRoute.Sitemap {
  const config = readSiteConfig();
  const baseUrl = (config.baseUrl || "https://tidynest-finds-515f.vercel.app").replace(
    /\/+$/,
    ""
  );
  const products = readProducts().filter((p) => !p.isSample);
  const collections = readCollections().filter((c) => !c.isSample);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/links`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${baseUrl}/collections/${c.slug}`,
    lastModified: new Date(c.createdAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/finds/${p.slug}`,
    lastModified: new Date(p.createdAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...collectionPages, ...productPages];
}
