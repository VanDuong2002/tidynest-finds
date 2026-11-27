import type { MetadataRoute } from "next";
import { readSiteConfig } from "@/lib/storage";

export default function robots(): MetadataRoute.Robots {
  const config = readSiteConfig();
  const baseUrl = (config.baseUrl || "https://tidynest-finds-515f.vercel.app").replace(
    /\/+$/,
    ""
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/api/studio/", "/go/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
