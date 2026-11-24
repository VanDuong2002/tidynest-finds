import { notFound } from "next/navigation";
import { isStudioEnabled } from "@/lib/studio-guard";
import {
  readAnalytics,
  readCollections,
  readProducts,
  readSiteConfig,
} from "@/lib/storage";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export const dynamic = "force-dynamic";

export default function StudioPage() {
  if (!isStudioEnabled()) {
    notFound();
  }

  const config = readSiteConfig();
  const products = readProducts();
  const collections = readCollections();
  const analytics = readAnalytics();

  return (
    <StudioWorkspace
      initialConfig={config}
      initialProducts={products}
      initialCollections={collections}
      initialAnalytics={analytics}
    />
  );
}
