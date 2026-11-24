import type { PinTemplateId } from "./types";

export const PIN_WIDTH = 1000;
export const PIN_HEIGHT = 1500;

export type PinThemeId = "cream" | "terracotta" | "sage" | "espresso";

export interface PinRenderOptions {
  template: PinTemplateId;
  theme: PinThemeId;
  headline: string;
  badgeText: string;
  footerLabel: string;
  imageUrls: string[];
}

interface ThemePalette {
  bg: string;
  card: string;
  bannerBg: string;
  bannerText: string;
  headline: string;
  accent: string;
  accentText: string;
  footer: string;
}

const PALETTES: Record<PinThemeId, ThemePalette> = {
  cream: {
    bg: "#FAF7F2",
    card: "#FFFFFF",
    bannerBg: "#1F1B18",
    bannerText: "#FAF7F2",
    headline: "#1F1B18",
    accent: "#C25E3A",
    accentText: "#FFFFFF",
    footer: "#7A6E64",
  },
  terracotta: {
    bg: "#F8EFE8",
    card: "#FFFFFF",
    bannerBg: "#C25E3A",
    bannerText: "#FFFFFF",
    headline: "#2A1F1A",
    accent: "#1F1B18",
    accentText: "#FAF7F2",
    footer: "#8A5643",
  },
  sage: {
    bg: "#EFF3EE",
    card: "#FFFFFF",
    bannerBg: "#4D6B57",
    bannerText: "#FFFFFF",
    headline: "#1C2920",
    accent: "#C25E3A",
    accentText: "#FFFFFF",
    footer: "#556B5C",
  },
  espresso: {
    bg: "#1F1B18",
    card: "#2C2622",
    bannerBg: "#C25E3A",
    bannerText: "#FFFFFF",
    headline: "#FAF7F2",
    accent: "#D9825B",
    accentText: "#1F1B18",
    footer: "#C4B8AD",
  },
};

function resolveProxyUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return `/api/studio/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = resolveProxyUrl(url);
  });
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
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 0
) {
  ctx.save();
  if (radius > 0) {
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  const imgRatio = img.width / (img.height || 1);
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offsetX = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offsetY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        const rest = [current, ...words.slice(i + 1)].join(" ");
        let trimmed = rest;
        while (
          trimmed.length > 3 &&
          ctx.measureText(`${trimmed}…`).width > maxWidth
        ) {
          trimmed = trimmed.slice(0, -1).trimEnd();
        }
        lines.push(trimmed === rest ? rest : `${trimmed}…`);
        return lines;
      }
    }
  }
  lines.push(current);
  return lines;
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  bg: string,
  fg: string
) {
  ctx.save();
  ctx.font = "700 26px system-ui, -apple-system, sans-serif";
  const textW = ctx.measureText(text.toUpperCase()).width;
  const padX = 36;
  const h = 58;
  const w = textW + padX * 2;
  drawRoundedRect(ctx, centerX - w / 2, y, w, h, 29);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), centerX, y + h / 2 + 1);
  ctx.restore();
}

export async function renderPinToCanvas(
  canvas: HTMLCanvasElement,
  options: PinRenderOptions
): Promise<void> {
  canvas.width = PIN_WIDTH;
  canvas.height = PIN_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const palette = PALETTES[options.theme];
  const loadedImages = (
    await Promise.all(options.imageUrls.slice(0, 4).map(loadImage))
  ).filter((img): img is HTMLImageElement => Boolean(img));

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, PIN_WIDTH, PIN_HEIGHT);

  if (options.template === "editorial") {
    drawPill(
      ctx,
      options.badgeText || "AMAZON HOME FIND",
      PIN_WIDTH / 2,
      78,
      palette.accent,
      palette.accentText
    );

    ctx.fillStyle = palette.headline;
    ctx.font = "700 62px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const lines = wrapText(ctx, options.headline, 840, 3);
    lines.forEach((line, idx) => {
      ctx.fillText(line, PIN_WIDTH / 2, 170 + idx * 76);
    });

    const imgTop = 435;
    const imgSize = 860;
    const imgX = (PIN_WIDTH - imgSize) / 2;
    drawRoundedRect(ctx, imgX, imgTop, imgSize, imgSize, 42);
    ctx.fillStyle = palette.card;
    ctx.fill();

    if (loadedImages[0]) {
      drawImageCover(ctx, loadedImages[0], imgX, imgTop, imgSize, imgSize, 42);
    }

    ctx.fillStyle = palette.footer;
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      (options.footerLabel || "TIDYNEST FINDS").toUpperCase(),
      PIN_WIDTH / 2,
      1380
    );
    return;
  }

  if (options.template === "bold-banner") {
    const bannerH = 440;
    ctx.fillStyle = palette.bannerBg;
    ctx.fillRect(0, 0, PIN_WIDTH, bannerH);

    drawPill(
      ctx,
      options.badgeText || "AMAZON MUST-HAVE",
      PIN_WIDTH / 2,
      68,
      palette.accent,
      palette.accentText
    );

    ctx.fillStyle = palette.bannerText;
    ctx.font = "700 64px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const lines = wrapText(ctx, options.headline, 860, 3);
    lines.forEach((line, idx) => {
      ctx.fillText(line, PIN_WIDTH / 2, 162 + idx * 78);
    });

    if (loadedImages[0]) {
      drawImageCover(
        ctx,
        loadedImages[0],
        0,
        bannerH,
        PIN_WIDTH,
        PIN_HEIGHT - bannerH,
        0
      );
    }

    // Bottom floating brand bar
    drawRoundedRect(ctx, 210, 1375, 580, 74, 37);
    ctx.fillStyle = "rgba(31, 27, 24, 0.88)";
    ctx.fill();
    ctx.fillStyle = "#FAF7F2";
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${options.footerLabel || "TidyNest Finds"} • Tap to Shop`,
      PIN_WIDTH / 2,
      1412
    );
    return;
  }

  // listicle-collage (2x2 grid + centered title card)
  const gap = 16;
  const cellW = (PIN_WIDTH - gap * 3) / 2;
  const cellH = (PIN_HEIGHT - gap * 3) / 2;
  const slots = [
    { x: gap, y: gap },
    { x: gap * 2 + cellW, y: gap },
    { x: gap, y: gap * 2 + cellH },
    { x: gap * 2 + cellW, y: gap * 2 + cellH },
  ];

  slots.forEach((slot, idx) => {
    const img = loadedImages[idx] ?? loadedImages[0];
    if (img) {
      drawImageCover(ctx, img, slot.x, slot.y, cellW, cellH, 24);
    } else {
      drawRoundedRect(ctx, slot.x, slot.y, cellW, cellH, 24);
      ctx.fillStyle = palette.card;
      ctx.fill();
    }
  });

  // Centered editorial title card
  const cardW = 860;
  const cardH = 420;
  const cardX = (PIN_WIDTH - cardW) / 2;
  const cardY = (PIN_HEIGHT - cardH) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = palette.card;
  ctx.fill();
  ctx.restore();

  drawPill(
    ctx,
    options.badgeText || "CURATED AMAZON LIST",
    PIN_WIDTH / 2,
    cardY + 46,
    palette.accent,
    palette.accentText
  );

  ctx.fillStyle = palette.headline;
  ctx.font = "700 56px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, options.headline, 760, 3);
  lines.forEach((line, idx) => {
    ctx.fillText(line, PIN_WIDTH / 2, cardY + 132 + idx * 70);
  });

  ctx.fillStyle = palette.footer;
  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    (options.footerLabel || "TIDYNEST FINDS").toUpperCase(),
    PIN_WIDTH / 2,
    cardY + cardH - 54
  );
}
