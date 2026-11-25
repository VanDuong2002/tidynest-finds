"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Rss,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { Product, SiteConfig } from "@/lib/types";

interface AutomationTabProps {
  config: SiteConfig;
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  onConfigChange: (config: SiteConfig) => void;
}

interface PublishStatus {
  pendingCount: number;
  files: string[];
  branch: string;
  baseUrl: string;
  rssUrl: string;
}

interface PinterestStatus {
  hasToken: boolean;
  boardId: string;
  pinterestSandbox: boolean;
  rssUrl: string;
}

export function AutomationTab({
  config,
  products,
  onProductsChange,
  onConfigChange,
}: AutomationTabProps) {
  // Quick Amazon tag save
  const [associateTag, setAssociateTag] = useState(
    config.amazonAssociateTag ?? ""
  );
  const [savingTag, setSavingTag] = useState(false);

  // Batch / single Amazon URL import
  const [importInput, setImportInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<
    { line: string; ok: boolean; text: string; shortLink?: string }[]
  >([]);

  // Web publish (Git -> Vercel)
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [publishingWeb, setPublishingWeb] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Pinterest automation
  const [pinStatus, setPinStatus] = useState<PinterestStatus | null>(null);
  const [pinTokenInput, setPinTokenInput] = useState("");
  const [pinBoardId, setPinBoardId] = useState("");
  const [pinSandbox, setPinSandbox] = useState(false);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [savingPinCfg, setSavingPinCfg] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(
    products.find((p) => !p.isSample)?.id || products[0]?.id || ""
  );
  const [postingPin, setPostingPin] = useState(false);
  const [pinMsg, setPinMsg] = useState<{
    type: "ok" | "err";
    text: string;
    url?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = (config.baseUrl || "http://localhost:3000").replace(/\/+$/, "");
  const rssUrl = `${baseUrl}/rss.xml`;
  const sampleProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const bookmarkletHref = useMemo(() => {
    const code = `(function(){var t=(document.querySelector('#productTitle')?.textContent||document.title||'').trim();var img=document.querySelector('#landingImage')?.getAttribute('data-old-hires')||document.querySelector('#landingImage')?.getAttribute('src')||document.querySelector('meta[property="og:image"]')?.getAttribute('content')||'';var pTxt=(document.querySelector('.a-price .a-offscreen')?.textContent||'').replace(/[^0-9.]/g,'');var b=Array.from(document.querySelectorAll('#feature-bullets li span.a-list-item')).map(function(e){return e.textContent.trim();}).filter(function(x){return x.length>12&&!/model number/i.test(x);}).slice(0,4);var payload=JSON.stringify({input:location.href,title:t,imageUrl:img,priceUsd:pTxt?Number(pTxt):undefined,highlights:b});window.open('http://localhost:3000/studio?import='+encodeURIComponent(payload),'_blank');})();`;
    return `javascript:${code}`;
  }, []);

  async function refreshStatuses() {
    try {
      const [pubRes, pinRes] = await Promise.all([
        fetch("/api/studio/publish"),
        fetch("/api/studio/pinterest"),
      ]);
      if (pubRes.ok) {
        setPublishStatus(await pubRes.json());
      }
      if (pinRes.ok) {
        const data = (await pinRes.json()) as PinterestStatus;
        setPinStatus(data);
        setPinBoardId(data.boardId || "");
        setPinSandbox(Boolean(data.pinterestSandbox));
      }
    } catch {
      // Ignore transient refresh errors
    }
  }

  useEffect(() => {
    refreshStatuses();
  }, []);

  function copyText(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  async function handleSaveAssociateTag() {
    setSavingTag(true);
    try {
      const res = await fetch("/api/studio/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amazonAssociateTag: associateTag.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.config) {
        onConfigChange(data.config);
      }
    } finally {
      setSavingTag(false);
    }
  }

  async function handleBatchImport() {
    const lines = importInput
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setImporting(true);
    setImportLogs([]);
    const results: {
      line: string;
      ok: boolean;
      text: string;
      shortLink?: string;
    }[] = [];

    for (const line of lines) {
      try {
        const res = await fetch("/api/studio/import-amazon", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            input: line,
            autoSave: true,
            downloadImage: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          results.push({
            line,
            ok: false,
            text: data.error || "Không nhập được link này.",
          });
        } else if (data.saved && data.products) {
          onProductsChange(data.products);
          results.push({
            line,
            ok: true,
            text: `Đã tạo: ${data.product.title}`,
            shortLink: data.shortLink,
          });
        } else {
          results.push({
            line,
            ok: false,
            text:
              data.message ||
              "Amazon chặn bot quét trực tiếp. Hãy mở link trên trình duyệt rồi bấm Bookmarklet 1-click bên dưới!",
          });
        }
      } catch (err) {
        results.push({
          line,
          ok: false,
          text: err instanceof Error ? err.message : "Lỗi mạng.",
        });
      }
      setImportLogs([...results]);
    }

    setImporting(false);
    setImportInput("");
    refreshStatuses();
  }

  async function handlePublishWeb() {
    setPublishingWeb(true);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishMsg({
          type: "err",
          text: data.error || "Xuất bản thất bại.",
        });
      } else {
        setPublishMsg({ type: "ok", text: data.message });
        refreshStatuses();
      }
    } catch (err) {
      setPublishMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi kết nối.",
      });
    } finally {
      setPublishingWeb(false);
    }
  }

  async function handleSavePinterestSecrets(e: React.FormEvent) {
    e.preventDefault();
    setSavingPinCfg(true);
    setPinMsg(null);
    try {
      const res = await fetch("/api/studio/pinterest", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pinterestAccessToken: pinTokenInput || undefined,
          pinterestBoardId: pinBoardId,
          pinterestSandbox: pinSandbox,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPinTokenInput("");
        setPinStatus((prev) =>
          prev
            ? {
                ...prev,
                hasToken: data.hasToken,
                boardId: data.boardId,
                pinterestSandbox: data.pinterestSandbox,
              }
            : null
        );
        setPinMsg({
          type: "ok",
          text: "Đã lưu cấu hình Pinterest API (chỉ lưu nội bộ trên máy, không đẩy lên GitHub).",
        });
      }
    } finally {
      setSavingPinCfg(false);
    }
  }

  async function handleLoadBoards() {
    setLoadingBoards(true);
    setPinMsg(null);
    try {
      const res = await fetch("/api/studio/pinterest?action=boards");
      const data = await res.json();
      if (!res.ok) {
        setPinMsg({
          type: "err",
          text: data.error || "Không tải được danh sách Board.",
        });
      } else {
        setBoards(data.boards || []);
        if (data.boards?.[0] && !pinBoardId) {
          setPinBoardId(data.boards[0].id);
        }
      }
    } finally {
      setLoadingBoards(false);
    }
  }

  async function handlePostPinNow() {
    if (!selectedProductId) return;
    setPostingPin(true);
    setPinMsg(null);
    try {
      const res = await fetch("/api/studio/pinterest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinMsg({ type: "err", text: data.error || "Đăng Pin thất bại." });
      } else {
        setPinMsg({
          type: "ok",
          text: data.message,
          url: data.pinUrl,
        });
      }
    } finally {
      setPostingPin(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Amazon Auto-Import & Tag */}
      <section className="rounded-2xl border border-[#E6DCCF] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4ECE1] px-3 py-1 text-[11px] font-semibold text-[#B84A27]">
              <Wand2 className="h-3.5 w-3.5" />
              Bước 1 — Tự động hút sản phẩm &amp; gắn link Affiliate
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-[#181512]">
              Dán link Amazon / ASIN — tự gắn tag, tải ảnh &amp; viết mô tả
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={associateTag}
              onChange={(e) => setAssociateTag(e.target.value)}
              placeholder="Amazon Tag (vd: tidynest-20)"
              className="w-52 rounded-xl border border-[#DDD1C2] px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={handleSaveAssociateTag}
              disabled={savingTag}
              className="rounded-xl bg-[#181512] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#332D28]"
            >
              {savingTag ? "Đang lưu..." : "Lưu Tag"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-3">
            <textarea
              rows={4}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder={`Dán 1 hoặc nhiều link Amazon / amzn.to / mã ASIN (mỗi dòng 1 sản phẩm):\nhttps://www.amazon.com/dp/B09XYZ1234\nB08ABCDEFG`}
              className="w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2.5 text-sm font-mono text-xs"
            />
            <button
              type="button"
              onClick={handleBatchImport}
              disabled={importing || !importInput.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#B84A27] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#993B1D] disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {importing
                ? "Đang hút thông tin & tải ảnh..."
                : "Tự động tạo sản phẩm & gắn link"}
            </button>

            {importLogs.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-3.5 text-xs">
                {importLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-center justify-between gap-2 ${
                      log.ok ? "text-[#2F523B]" : "text-[#9F2A2A]"
                    }`}
                  >
                    <span>
                      <strong>{log.ok ? "✓" : "!"}</strong> {log.text}
                    </span>
                    {log.shortLink ? (
                      <button
                        type="button"
                        onClick={() => copyText(`short-${i}`, log.shortLink!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D8CBB9] bg-white px-2 py-1 text-[11px] font-semibold text-[#181512]"
                      >
                        {copiedKey === `short-${i}` ? (
                          <Check className="h-3 w-3 text-[#2F523B]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy link gọn
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* 1-Click Browser Bookmarklet */}
          <div className="lg:col-span-2 rounded-xl border border-dashed border-[#CBBBA8] bg-[#FAF7F2] p-4 flex flex-col justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#181512]">
                <BookmarkPlus className="h-4 w-4 text-[#B84A27]" />
                Cách nhanh nhất (không bao giờ bị Amazon chặn):
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5E534A]">
                Kéo nút bên dưới thả lên <strong>thanh Dấu trang (Bookmarks Bar)</strong>{" "}
                của Chrome/Edge. Khi đang xem bất kỳ món nào trên Amazon.com, chỉ cần bấm nút đó 1 cái — nó sẽ tự lấy tên, ảnh nét, giá, gạch đầu dòng và gửi thẳng vào Studio!
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={bookmarkletHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#181512] px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-grab active:cursor-grabbing"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#E5956E]" />
                + Gửi vào TidyNest
              </a>
              <span className="text-[11px] text-[#7A6E64]">
                (Kéo thả lên thanh Bookmark)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 & 3 Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 2: 1-Click Publish to Web (Vercel) */}
        <section className="rounded-2xl border border-[#E6DCCF] bg-white p-6 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAEFE9] px-3 py-1 text-[11px] font-semibold text-[#2F523B]">
              <Rocket className="h-3.5 w-3.5" />
              Bước 2 — Tự động xuất bản lên Web (Vercel)
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-[#181512]">
              Đẩy toàn bộ sản phẩm &amp; ảnh mới lên mạng chỉ với 1 nút bấm
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#5E534A]">
              Thay vì phải mở terminal gõ <code>git add / commit / push</code>, bấm nút bên dưới để tự đồng bộ dữ liệu lên GitHub — Vercel sẽ tự cập nhật trang web công khai sau ~30 giây.
            </p>

            <div className="mt-4 rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#665B52]">Thay đổi đang chờ xuất bản:</span>
                <span className="font-semibold text-[#181512]">
                  {publishStatus
                    ? `${publishStatus.pendingCount} file`
                    : "Đang kiểm tra..."}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#665B52]">Web công khai:</span>
                <a
                  href={baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#B84A27] hover:underline"
                >
                  {baseUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {publishMsg ? (
              <p
                className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                  publishMsg.type === "ok"
                    ? "bg-[#EAEFE9] text-[#2F523B]"
                    : "bg-[#FDECEC] text-[#9F2A2A]"
                }`}
              >
                {publishMsg.text}
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handlePublishWeb}
              disabled={publishingWeb}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#181512] px-5 py-3 text-sm font-semibold text-white hover:bg-[#332D28] disabled:opacity-50"
            >
              {publishingWeb ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {publishingWeb
                ? "Đang đẩy lên GitHub & Vercel..."
                : "Xuất bản lên Web ngay (1-Click)"}
            </button>
          </div>
        </section>

        {/* Step 3: Auto Pinterest (RSS + Direct API v5) */}
        <section className="rounded-2xl border border-[#E6DCCF] bg-white p-6 space-y-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-3 py-1 text-[11px] font-semibold text-[#B84A27]">
              <Rss className="h-3.5 w-3.5" />
              Bước 3 — Tự động đăng Pin lên Pinterest
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-[#181512]">
              RSS Auto-Publish (0 thao tác) + Đăng API trực tiếp
            </h2>
          </div>

          {/* Method A: RSS Feed */}
          <div className="rounded-xl border border-[#E6DCCF] bg-[#FAF7F2] p-4 space-y-2.5 text-xs">
            <p className="font-semibold text-[#181512]">
              Cách A (Khuyên dùng — Cài 1 lần, tự đăng mãi mãi):
            </p>
            <p className="text-[#5E534A] leading-relaxed">
              Web đã tự tạo sẵn nguồn <strong>RSS Feed</strong> kèm ảnh Pin dọc{" "}
              <code>1000×1500</code> cho mọi sản phẩm. Vào{" "}
              <strong>Pinterest Business → Settings → Bulk create Pins (Auto-publish)</strong>{" "}
              và dán link này:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={rssUrl}
                className="flex-1 rounded-lg border border-[#DDD1C2] bg-white px-3 py-1.5 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => copyText("rss", rssUrl)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#181512] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                {copiedKey === "rss" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedKey === "rss" ? "Đã copy" : "Copy RSS"}
              </button>
            </div>
            {sampleProduct ? (
              <a
                href={`/api/pin-image/${sampleProduct.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B84A27] hover:underline"
              >
                Xem trước ảnh Pin 1000×1500 tự động của &ldquo;{sampleProduct.title.slice(0, 32)}...&rdquo;
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>

          {/* Method B: Direct Pinterest API v5 */}
          <form
            onSubmit={handleSavePinterestSecrets}
            className="rounded-xl border border-[#E6DCCF] p-4 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#181512]">
                Cách B: Đăng ngay lập tức qua Pinterest API v5
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  pinStatus?.hasToken
                    ? "bg-[#EAEFE9] text-[#2F523B]"
                    : "bg-[#F4ECE1] text-[#7A6E64]"
                }`}
              >
                {pinStatus?.hasToken ? "Đã lưu Token" : "Chưa có Token"}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="password"
                value={pinTokenInput}
                onChange={(e) => setPinTokenInput(e.target.value)}
                placeholder={
                  pinStatus?.hasToken
                    ? "•••••••• (để trống nếu giữ nguyên)"
                    : "Pinterest Access Token (pina_...)"
                }
                className="rounded-lg border border-[#DDD1C2] px-3 py-1.5"
              />
              <div className="flex gap-1.5">
                {boards.length > 0 ? (
                  <select
                    value={pinBoardId}
                    onChange={(e) => setPinBoardId(e.target.value)}
                    className="flex-1 rounded-lg border border-[#DDD1C2] bg-white px-2 py-1.5"
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={pinBoardId}
                    onChange={(e) => setPinBoardId(e.target.value)}
                    placeholder="Board ID"
                    className="flex-1 rounded-lg border border-[#DDD1C2] px-3 py-1.5"
                  />
                )}
                <button
                  type="button"
                  onClick={handleLoadBoards}
                  disabled={loadingBoards}
                  className="rounded-lg border border-[#DDD1C2] px-2.5 py-1.5 font-semibold hover:bg-[#FAF7F2]"
                >
                  {loadingBoards ? "..." : "Tải Board"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-[11px] text-[#5E534A]">
                <input
                  type="checkbox"
                  checked={pinSandbox}
                  onChange={(e) => setPinSandbox(e.target.checked)}
                />
                Dùng Pinterest Sandbox (khi app chưa duyệt Standard Access)
              </label>
              <button
                type="submit"
                disabled={savingPinCfg}
                className="rounded-lg bg-[#181512] px-3 py-1.5 font-semibold text-white hover:bg-[#332D28]"
              >
                {savingPinCfg ? "Đang lưu..." : "Lưu kết nối API"}
              </button>
            </div>

            {products.length > 0 ? (
              <div className="border-t border-[#EFE7DC] pt-3 flex flex-wrap items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-lg border border-[#DDD1C2] bg-white px-2.5 py-1.5"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handlePostPinNow}
                  disabled={postingPin || !pinStatus?.hasToken}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#B84A27] px-3.5 py-1.5 font-semibold text-white hover:bg-[#993B1D] disabled:opacity-50"
                >
                  {postingPin ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Đăng Pin ngay
                </button>
              </div>
            ) : null}

            {pinMsg ? (
              <p
                className={`rounded-lg px-3 py-2 text-[11px] font-medium ${
                  pinMsg.type === "ok"
                    ? "bg-[#EAEFE9] text-[#2F523B]"
                    : "bg-[#FDECEC] text-[#9F2A2A]"
                }`}
              >
                {pinMsg.text}{" "}
                {pinMsg.url ? (
                  <a
                    href={pinMsg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Xem Pin →
                  </a>
                ) : null}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
