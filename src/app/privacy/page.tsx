import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy and analytics disclosure.",
};

export default function PrivacyPage() {
  const config = readSiteConfig();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4D6B57]">
        Legal
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-[#1F1B18] sm:text-4xl">
        Privacy Policy
      </h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4F463F]">
        <p>
          Your privacy matters to us at <strong>{config.siteName}</strong>. We
          do not collect, sell, or rent personal information such as names,
          home addresses, or payment details on this site.
        </p>
        <h2 className="pt-2 font-display text-xl font-semibold text-[#1F1B18]">
          Analytics &amp; Cookies
        </h2>
        <p>
          We may use privacy-respecting web analytics (such as Google Analytics
          4) to understand aggregate page views and which curated product links
          visitors find most helpful.
        </p>
        <h2 className="pt-2 font-display text-xl font-semibold text-[#1F1B18]">
          Third-Party Affiliate Links
        </h2>
        <p>
          When you click an outbound link to Amazon.com, Amazon may set cookies
          in accordance with its own Privacy Notice to attribute qualifying
          purchases. We encourage you to review Amazon&apos;s privacy policy when
          leaving our website.
        </p>
      </div>
    </div>
  );
}
