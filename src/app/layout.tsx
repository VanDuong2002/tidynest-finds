import type { Metadata } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import Script from "next/script";
import { isValidGaMeasurementId, readSiteConfig } from "@/lib/storage";
import { isStudioEnabled } from "@/lib/studio-guard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = readSiteConfig();
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(config.baseUrl || "http://localhost:3000");
  } catch {
    metadataBase = undefined;
  }
  return {
    metadataBase,
    title: {
      default: `${config.siteName} — Curated Amazon Home & Kitchen Finds`,
      template: `%s | ${config.siteName}`,
    },
    description: config.tagline,
    openGraph: {
      title: `${config.siteName} — Curated Amazon Home & Kitchen Finds`,
      description: config.tagline,
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = readSiteConfig();
  const showStudioLink = isStudioEnabled();

  return (
    <html
      lang="en"
      className={`${funnelDisplay.variable} ${funnelSans.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        {config.gaMeasurementId &&
        isValidGaMeasurementId(config.gaMeasurementId) ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.gaMeasurementId)}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(config.gaMeasurementId)});`}
            </Script>
          </>
        ) : null}

        <SiteHeader config={config} showStudioLink={showStudioLink} />
        <main className="flex-1">{children}</main>
        <SiteFooter config={config} />
      </body>
    </html>
  );
}
