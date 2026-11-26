"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Share2,
} from "lucide-react";
import type { Collection, Product, SiteConfig } from "@/lib/types";
import {
  generateCollectionSocialPack,
  generateProductSocialPack,
  type MultiChannelContentPack,
} from "@/lib/social-generator";

interface SocialStudioTabProps {
  config: SiteConfig;
  products: Product[];
  collections: Collection[];
}

type VideoThemeId = "editorial" | "dark-luxury" | "clean-aqua";

const THEMES: Record<
  VideoThemeId,
  {
    name: string;
    bgTop: string;
    bgBottom: string;
    cardBg: string;
    ink: string;
    subInk: string;
    accent: string;
    accentText: string;
    barBg: string;
  }
> = {
  editorial: {
    name: "Warm Editorial",
    bgTop: "#F8F3EB",
    bgBottom: "#EFE4D5",
    cardBg: "#FFFFFF",
    ink: "#181512",
    subInk: "#52483F",
    accent: "#B84A27",
    accentText: "#FFFFFF",
    barBg: "rgba(24,21,18,0.18)",
  },
  "dark-luxury": {
    name: "Dark Luxury",
    bgTop: "#141210",
    bgBottom: "#231E1A",
    cardBg: "#1F1B18",
    ink: "#FAF6F0",
    subInk: "#D3C7B8",
    accent: "#E5956E",
    accentText: "#181512",
    barBg: "rgba(255,255,255,0.2)",
  },
  "clean-aqua": {
    name: "Clean Aqua",
    bgTop: "#EEF7F9",
    bgBottom: "#D6ECF2",
    cardBg: "#FFFFFF",
    ink: "#0F242C",
    subInk: "#3E5B66",
    accent: "#16748C",
    accentText: "#FFFFFF",
    barBg: "rgba(15,36,44,0.18)",
  },
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > 4 ? `${last.slice(0, -3).trimEnd()}...` : `${last}...`;
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function SocialStudioTab({
  config,
  products,
  collections,
}: SocialStudioTabProps) {
  const [targetType, setTargetType] = useState<"product" | "collection">("product");
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id || "");
  const [themeId, setThemeId] = useState<VideoThemeId>("editorial");
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [videoNotice, setVideoNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const selectedProduct = useMemo(() => {
    if (targetType !== "product") return null;
    return products.find((p) => p.id === selectedId) || products[0] || null;
  }, [targetType, selectedId, products]);

  const selectedCollection = useMemo(() => {
    if (targetType !== "collection") return null;
    return collections.find((c) => c.id === selectedId) || collections[0] || null;
  }, [targetType, selectedId, collections]);

  const pack: MultiChannelContentPack | null = useMemo(() => {
    if (targetType === "product" && selectedProduct) {
      const idx = Math.max(
        0,
        products.findIndex((p) => p.id === selectedProduct.id)
      );
      return generateProductSocialPack(selectedProduct, config.baseUrl, idx);
    }
    if (targetType === "collection" && selectedCollection) {
      return generateCollectionSocialPack(selectedCollection, config.baseUrl);
    }
    return null;
  }, [targetType, selectedProduct, selectedCollection, products, config.baseUrl]);

  const activeImageUrl =
    targetType === "product"
      ? selectedProduct?.imageUrl || ""
      : selectedCollection?.coverImageUrl || "";

  const drawFrame = useCallback(
    (progress01: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !pack) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1080;
      const H = 1920;
      const theme = THEMES[themeId];
      const sceneCount = pack.scenes.length;
      const rawScene = progress01 * sceneCount;
      const sceneIdx = Math.min(sceneCount - 1, Math.floor(rawScene));
      const sceneProgress = Math.min(1, Math.max(0, rawScene - sceneIdx));
      const scene = pack.scenes[sceneIdx];

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, theme.bgTop);
      grad.addColorStop(1, theme.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Top 4-segment Stories/Reels progress bar
      const barPad = 56;
      const gap = 14;
      const segW = (W - barPad * 2 - gap * (sceneCount - 1)) / sceneCount;
      for (let i = 0; i < sceneCount; i++) {
        const bx = barPad + i * (segW + gap);
        ctx.fillStyle = theme.barBg;
        drawRoundedRect(ctx, bx, 64, segW, 10, 5);
        ctx.fill();

        const fillRatio = i < sceneIdx ? 1 : i === sceneIdx ? sceneProgress : 0;
        if (fillRatio > 0) {
          ctx.fillStyle = theme.accent;
          drawRoundedRect(ctx, bx, 64, Math.max(10, segW * fillRatio), 10, 5);
          ctx.fill();
        }
      }

      // Top badge pill
      const badgeLabel = (scene.badgeText || pack.itemNumber).toUpperCase();
      ctx.font = "700 32px system-ui, -apple-system, sans-serif";
      const badgeW = ctx.measureText(badgeLabel).width + 64;
      const badgeX = (W - badgeW) / 2;
      ctx.fillStyle = theme.accent;
      drawRoundedRect(ctx, badgeX, 124, badgeW, 68, 34);
      ctx.fill();
      ctx.fillStyle = theme.accentText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeLabel, W / 2, 159);

      // Center HD Image frame with smooth Ken Burns zoom
      const frameX = 80;
      const frameY = 250;
      const frameW = W - 160;
      const frameH = 920;

      ctx.save();
      drawRoundedRect(ctx, frameX, frameY, frameW, frameH, 44);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.clip();

      const img = loadedImageRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const zoom = 1.0 + progress01 * 0.14;
        const scale =
          Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) * zoom;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const dx = frameX + (frameW - drawW) / 2;
        const dy = frameY + (frameH - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      } else {
        ctx.fillStyle = theme.subInk;
        ctx.font = "600 40px system-ui, sans-serif";
        ctx.fillText(config.siteName, W / 2, frameY + frameH / 2);
      }
      ctx.restore();

      // Subtle border around image frame
      ctx.strokeStyle = theme.barBg;
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, frameX, frameY, frameW, frameH, 44);
      ctx.stroke();

      // Scene Headline Card (bottom area)
      const cardX = 64;
      const cardY = 1230;
      const cardW = W - 128;
      const cardH = 490;
      ctx.fillStyle = theme.cardBg;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
      ctx.fill();

      // Headline
      ctx.fillStyle = theme.ink;
      ctx.font = "700 58px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const headlineLines = wrapText(ctx, scene.headline, cardW - 96, 3);
      let cursorY = cardY + 64;
      for (const line of headlineLines) {
        ctx.fillText(line, W / 2, cursorY);
        cursorY += 72;
      }

      // Subline
      ctx.fillStyle = theme.subInk;
      ctx.font = "500 36px system-ui, -apple-system, sans-serif";
      const subLines = wrapText(ctx, scene.subline, cardW - 110, 3);
      cursorY += 20;
      for (const line of subLines) {
        ctx.fillText(line, W / 2, cursorY);
        cursorY += 50;
      }

      // Footer Brand Bar
      ctx.fillStyle = theme.subInk;
      ctx.font = "600 30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${config.siteName}  •  ${pack.linksBioUrl.replace(/^https?:\/\//i, "")}`,
        W / 2,
        1805
      );
    },
    [pack, themeId, config.siteName]
  );

  // Load product/collection image safely for Canvas
  useEffect(() => {
    if (!activeImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    const src = activeImageUrl.startsWith("/")
      ? activeImageUrl
      : `/api/studio/image-proxy?url=${encodeURIComponent(activeImageUrl)}`;
    img.onload = () => {
      loadedImageRef.current = img;
      drawFrame((activeSceneIdx + 0.35) / 4);
    };
    img.src = src;
  }, [activeImageUrl, activeSceneIdx, drawFrame]);

  useEffect(() => {
    if (!previewPlaying && !exporting) {
      drawFrame((activeSceneIdx + 0.35) / 4);
    }
  }, [activeSceneIdx, themeId, pack, previewPlaying, exporting, drawFrame]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handlePreviewAnimation() {
    if (previewPlaying || exporting) return;
    setPreviewPlaying(true);
    setVideoNotice(null);
    const totalMs = 12000;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / totalMs);
      drawFrame(p);
      setActiveSceneIdx(Math.min(3, Math.floor(p * 4)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPreviewPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleExportVideo() {
    const canvas = canvasRef.current;
    if (!canvas || !pack || exporting) return;

    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      setVideoNotice(
        "Trình duyệt này không hỗ trợ MediaRecorder. Hãy dùng Chrome hoặc Edge bản mới nhất để xuất video."
      );
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setVideoNotice("Đang render video 9:16 (1080×1920, 12 giây)...");

    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_500_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const donePromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    recorder.start(200);
    const totalMs = 12000;
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / totalMs);
        drawFrame(p);
        setActiveSceneIdx(Math.min(3, Math.floor(p * 4)));
        setExportProgress(Math.round(p * 100));
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    });

    recorder.stop();
    const blob = await donePromise;
    const url = URL.createObjectURL(blob);
    const slug =
      (targetType === "product"
        ? selectedProduct?.slug
        : selectedCollection?.slug) || "tidynest";
    const a = document.createElement("a");
    a.href = url;
    a.download = `tidynest-${slug}-reel-9x16.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    setExporting(false);
    setExportProgress(100);
    setVideoNotice(
      "✓ Đã xuất xong video dọc 1080×1920 (.webm)! Bạn có thể up thẳng lên TikTok, YouTube Shorts, Instagram Reels & Facebook Reels."
    );
  }

  function copyText(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  if (!pack) {
    return (
      <div className="rounded-2xl border border-[#E6DCCF] bg-white p-8 text-center text-sm text-[#665B52]">
        Hãy thêm ít nhất 1 sản phẩm trước để tạo video và nội dung đa kênh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Link-in-Bio Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6DCCF] bg-white p-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4ECE1] px-3 py-1 text-[11px] font-semibold text-[#B84A27]">
            <Share2 className="h-3.5 w-3.5" />
            Chiến lược Đa Kênh — 1 Video đăng 4 nơi (TikTok US · IG Reels · FB Reels · YT Shorts)
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold text-[#181512]">
            Xưởng Video 9:16 &amp; Kịch bản Bán hàng Đa Nền Tảng
          </h2>
          <p className="mt-0.5 text-xs text-[#665B52]">
            Gắn link Bio bên phải vào hồ sơ TikTok / Instagram / YouTube / Facebook — khách chỉ cần gõ số{" "}
            <strong>{pack.itemNumber}</strong> là thấy ngay nút mua Amazon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={pack.linksBioUrl}
            className="w-64 rounded-xl border border-[#DDD1C2] bg-[#FAF7F2] px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => copyText("bio", pack.linksBioUrl)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#181512] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#332D28]"
          >
            {copiedKey === "bio" ? (
              <Check className="h-3.5 w-3.5 text-[#7EE2A8]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedKey === "bio" ? "Đã copy" : "Copy Link Bio"}
          </button>
          <a
            href="/links"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-[#DDD1C2] bg-white px-3 py-2 text-xs font-semibold text-[#181512] hover:border-[#B84A27]"
          >
            Xem /links
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 5 cols: 9:16 Video Canvas + Export Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType("product");
                  if (products[0]) setSelectedId(products[0].id);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  targetType === "product"
                    ? "bg-[#181512] text-white"
                    : "border border-[#E6DCCF] bg-[#FAF7F2] text-[#4F463F]"
                }`}
              >
                Theo Sản phẩm ({products.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("collection");
                  if (collections[0]) setSelectedId(collections[0].id);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  targetType === "collection"
                    ? "bg-[#181512] text-white"
                    : "border border-[#E6DCCF] bg-[#FAF7F2] text-[#4F463F]"
                }`}
              >
                Theo Bộ sưu tập ({collections.length})
              </button>
            </div>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-[#DDD1C2] bg-white px-3 py-2 text-xs font-medium"
            >
              {targetType === "product"
                ? products.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      #{String(idx + 1).padStart(2, "0")} — {p.title}
                    </option>
                  ))
                : collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
            </select>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(THEMES) as VideoThemeId[]).map((tid) => (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setThemeId(tid)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                    themeId === tid
                      ? "bg-[#B84A27] text-white"
                      : "border border-[#E6DCCF] bg-[#FAF7F2] text-[#5E534A]"
                  }`}
                >
                  {THEMES[tid].name}
                </button>
              ))}
            </div>

            {/* 9:16 Live Canvas Preview */}
            <div className="mx-auto w-[270px] overflow-hidden rounded-2xl border border-[#E6DCCF] bg-[#181512] shadow-md">
              <canvas
                ref={canvasRef}
                width={1080}
                height={1920}
                className="block h-[480px] w-[270px]"
              />
            </div>

            {/* Scene Selector Pills */}
            <div className="grid grid-cols-4 gap-1.5">
              {pack.scenes.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={previewPlaying || exporting}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                    activeSceneIdx === idx
                      ? "bg-[#181512] text-white"
                      : "bg-[#FAF7F2] text-[#5E534A] hover:bg-[#EFE6DA]"
                  }`}
                >
                  Cảnh {idx + 1}
                </button>
              ))}
            </div>

            {/* Play Preview + Export Video Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePreviewAnimation}
                disabled={previewPlaying || exporting}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#181512] bg-white px-3 py-2.5 text-xs font-semibold text-[#181512] hover:bg-[#FAF7F2] disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {previewPlaying ? "Đang chạy thử..." : "Xem thử 12s"}
              </button>
              <button
                type="button"
                onClick={handleExportVideo}
                disabled={exporting || previewPlaying}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#B84A27] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#993B1D] disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {exporting ? `Đang xuất ${exportProgress}%` : "Xuất Video 9:16"}
              </button>
            </div>

            {videoNotice ? (
              <p className="rounded-xl bg-[#FAF7F2] px-3 py-2 text-[11px] font-medium text-[#2F523B]">
                {videoNotice}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right 7 cols: Voiceover + 4 Platform Ready-to-Post Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Voiceover Script */}
          <div className="rounded-2xl border border-[#E6DCCF] bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-[#B84A27]" />
                <h3 className="font-display text-base font-semibold text-[#181512]">
                  Kịch bản lời thoại tiếng Anh Mỹ (Voiceover 12s — dùng cho TikTok TTS / ElevenLabs)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => copyText("voice", pack.voiceoverScript)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#181512] px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                {copiedKey === "voice" ? (
                  <Check className="h-3 w-3 text-[#7EE2A8]" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedKey === "voice" ? "Đã copy" : "Copy"}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[#FAF7F2] p-3.5 font-sans text-xs leading-relaxed text-[#352E29]">
              {pack.voiceoverScript}
            </pre>
          </div>

          {/* 4 Platform Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* TikTok US */}
            <div className="rounded-2xl border border-[#E6DCCF] bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#181512] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    TikTok US
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "tiktok",
                        `${pack.tiktok.caption}\n\n${pack.tiktok.hashtags.join(" ")}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline"
                  >
                    {copiedKey === "tiktok" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === "tiktok" ? "Đã copy" : "Copy trọn bộ"}
                  </button>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[#352E29]">
                  {pack.tiktok.caption}
                </p>
                <p className="mt-2 text-[11px] font-medium text-[#16748C]">
                  {pack.tiktok.hashtags.join(" ")}
                </p>
              </div>
            </div>

            {/* Instagram Reels */}
            <div className="rounded-2xl border border-[#E6DCCF] bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#E1306C] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Instagram Reels
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "ig",
                        `${pack.instagram.caption}\n\n${pack.instagram.hashtags.join(" ")}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline"
                  >
                    {copiedKey === "ig" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === "ig" ? "Đã copy" : "Copy trọn bộ"}
                  </button>
                </div>
                <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-[#352E29]">
                  {pack.instagram.caption}
                </p>
                <p className="mt-2 text-[11px] font-medium text-[#16748C]">
                  {pack.instagram.hashtags.join(" ")}
                </p>
              </div>
            </div>

            {/* Facebook Reels & Page */}
            <div className="rounded-2xl border border-[#E6DCCF] bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#1877F2] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Facebook Reels / Page
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText("fb-post", pack.facebook.postText)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline"
                  >
                    {copiedKey === "fb-post" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === "fb-post" ? "Đã copy" : "Copy bài"}
                  </button>
                </div>
                <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-[#352E29]">
                  {pack.facebook.postText}
                </p>
                <div className="mt-3 rounded-xl bg-[#FAF7F2] p-2.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#181512]">
                      Bình luận ghim đầu tiên:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText("fb-cmt", pack.facebook.firstComment)
                      }
                      className="font-semibold text-[#B84A27] hover:underline"
                    >
                      {copiedKey === "fb-cmt" ? "Đã copy" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-[#5E534A]">
                    {pack.facebook.firstComment}
                  </p>
                </div>
              </div>
            </div>

            {/* YouTube Shorts */}
            <div className="rounded-2xl border border-[#E6DCCF] bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#FF0000] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    YouTube Shorts
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "yt",
                        `${pack.youtubeShorts.title}\n\n${pack.youtubeShorts.description}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline"
                  >
                    {copiedKey === "yt" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedKey === "yt" ? "Đã copy" : "Copy trọn bộ"}
                  </button>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-[#181512]">
                  {pack.youtubeShorts.title}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-[#5E534A]">
                  {pack.youtubeShorts.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
