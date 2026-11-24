"use client";

import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import type { SiteConfig } from "@/lib/types";

interface SettingsTabProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
}

export function SettingsTab({ config, onConfigChange }: SettingsTabProps) {
  const [form, setForm] = useState<SiteConfig>(config);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/studio/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onConfigChange(data.config);
        setSavedMsg("Đã lưu cài đặt thành công!");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E6DCCF] bg-white p-6 space-y-4 text-sm"
      >
        <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
          Cài đặt thương hiệu &amp; đo lường
        </h2>

        <div>
          <label className="block font-medium text-[#352E29]">
            Tên thương hiệu / Website (Tiếng Anh)
          </label>
          <input
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
          />
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Khẩu hiệu trang chủ (Tagline tiếng Anh)
          </label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
          />
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Đường dẫn web công khai (Base URL sau khi deploy Vercel)
          </label>
          <input
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://tidynestfinds.vercel.app"
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
          />
          <p className="mt-1 text-xs text-[#7A6E64]">
            Xưởng Pin sẽ dùng đường dẫn này để tạo sẵn link gắn vào Pinterest.
          </p>
        </div>

        <div>
          <label className="block font-medium text-[#352E29]">
            Link hồ sơ Pinterest của bạn
          </label>
          <input
            value={form.pinterestUrl}
            onChange={(e) => setForm({ ...form, pinterestUrl: e.target.value })}
            placeholder="https://www.pinterest.com/ten_kenh_cua_ban"
            className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#352E29]">
              Mã Google Analytics 4 (tùy chọn)
            </label>
            <input
              value={form.gaMeasurementId}
              onChange={(e) =>
                setForm({ ...form, gaMeasurementId: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-medium text-[#352E29]">
              Tỷ giá quy đổi USD → VNĐ
            </label>
            <input
              type="number"
              value={form.usdToVndRate}
              onChange={(e) =>
                setForm({ ...form, usdToVndRate: Number(e.target.value) || 25400 })
              }
              className="mt-1 w-full rounded-xl border border-[#DDD1C2] px-3.5 py-2"
            />
          </div>
        </div>

        {savedMsg ? (
          <p className="rounded-xl bg-[#EAEFE9] px-3.5 py-2 text-xs font-medium text-[#2F523B]">
            {savedMsg}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C25E3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A54B2B]"
        >
          <Save className="h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </form>

      <div className="rounded-2xl border border-[#E6DCCF] bg-white p-6 space-y-5 text-sm">
        <h2 className="font-display text-xl font-semibold text-[#1F1B18]">
          Checklist bắt đầu kiếm tiền USD (4 bước)
        </h2>

        <ol className="space-y-4 text-xs leading-relaxed text-[#4F463F]">
          <li className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4D6B57]" />
            <div>
              <p className="font-semibold text-[#1F1B18]">
                Bước 1: Đưa web Showcase lên mạng miễn phí (Vercel)
              </p>
              <p className="mt-0.5">
                Đẩy thư mục dự án lên GitHub → kết nối Vercel (0 đồng) → dán
                link <code>https://...vercel.app</code> vào ô Base URL bên trái.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4D6B57]" />
            <div>
              <p className="font-semibold text-[#1F1B18]">
                Bước 2: Đăng ký Amazon Associates US &amp; Pinterest Business
              </p>
              <p className="mt-0.5">
                Dùng link web Vercel của bạn để đăng ký tài khoản{" "}
                <strong>Amazon Associates US</strong> (nhận tiền qua Payoneer) và
                chuyển tài khoản Pinterest sang <strong>Business</strong> miễn phí.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4D6B57]" />
            <div>
              <p className="font-semibold text-[#1F1B18]">
                Bước 3: Thay sản phẩm mẫu &amp; đăng đều 3–5 Pin/ngày
              </p>
              <p className="mt-0.5">
                Lấy link affiliate từ Amazon SiteStripe → thêm vào tab Sản phẩm
                → sang <strong>Xưởng Pin</strong> tải ảnh 1000×1500 &amp; copy chữ
                tiếng Anh đăng lên Pinterest.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4D6B57]" />
            <div>
              <p className="font-semibold text-[#1F1B18]">
                Bước 4: Cập nhật web &amp; theo dõi hoa hồng hàng tuần
              </p>
              <p className="mt-0.5">
                Mỗi khi thêm sản phẩm mới, chạy lệnh sau trong PowerShell để
                Vercel tự cập nhật web trong 30 giây:
              </p>
              <pre className="mt-2 rounded-xl bg-[#1F1B18] p-3 text-[11px] text-[#FAF7F2] overflow-x-auto">
{`git add .
git commit -m "Update finds"
git push`}
              </pre>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
