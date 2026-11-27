#!/usr/bin/env python3
"""
TidyNest Finds — 24/7 Cloud Autopilot (Runs on GitHub Actions even when laptop is OFF)
1. Pops 1 queued product from data/auto-queue.json (if any) -> adds to data/products.json
   OR picks the next real product in data/products.json not yet published to YouTube Shorts.
2. Generates a high-retention US English viral script (via Gemini 2.5 Flash if GEMINI_API_KEY
   is configured, with smart built-in fallback templates).
3. Renders a 1080x1920 9:16 vertical Short:
   - Mode A (Veo 3 Cinematic): If GEMINI_API_KEY & ENABLE_VEO3=true, generates cinematic 9:16
     lifestyle footage via Google Veo 3 (veo-3.0-generate-001) and composites CTA overlays.
   - Mode B (Pro Studio Engine — Free): Neural US English voiceover (en-US-JennyNeural /
     en-US-AriaNeural) + smooth Ken Burns motion on HD product photo + bold kinetic captions.
4. Uploads directly to YouTube Shorts via YouTube Data API v3 if YouTube OAuth secrets are set.
5. Updates data/published-videos.json so the GitHub Actions workflow commits & pushes changes,
   triggering Vercel deploy + Pinterest RSS Auto-Publish automatically.
"""

import asyncio
import base64
import json
import os
import re
import subprocess
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import edge_tts
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = Path(__file__).resolve().parent.parent
DATA_DIR = WORKSPACE / "data"
PUBLIC_DIR = WORKSPACE / "public"
UPLOAD_IMG_DIR = PUBLIC_DIR / "images" / "uploads"
WORK_DIR = WORKSPACE / ".autopilot_tmp"
WORK_DIR.mkdir(parents=True, exist_ok=True)

PRODUCTS_PATH = DATA_DIR / "products.json"
CONFIG_PATH = DATA_DIR / "site-config.json"
QUEUE_PATH = DATA_DIR / "auto-queue.json"
PUBLISHED_PATH = DATA_DIR / "published-videos.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
ENABLE_VEO3 = os.environ.get("ENABLE_VEO3", "false").strip().lower() in ("1", "true", "yes")
YT_CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID", "").strip()
YT_CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET", "").strip()
YT_REFRESH_TOKEN = os.environ.get("YOUTUBE_REFRESH_TOKEN", "").strip()


def get_ffmpeg() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


FFMPEG = get_ffmpeg()


def extract_asin(url: str) -> str:
    m = re.search(r"/dp/([A-Z0-9]{10})", url or "", re.IGNORECASE)
    return m.group(1).upper() if m else ""


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def pop_from_queue_if_any(products: list, config: dict) -> list:
    queue = load_json(QUEUE_PATH, [])
    if not queue:
        return products

    item = queue.pop(0)
    save_json(QUEUE_PATH, queue)

    asin = str(item.get("asin", "")).strip().upper()
    if asin and any(extract_asin(p.get("affiliateUrl", "")) == asin for p in products):
        print(f"[queue] Skipping duplicate ASIN {asin}")
        return products

    # Download HD image into public/images/uploads
    img_url = str(item.get("imageUrl", "")).strip()
    local_img = img_url
    if img_url.startswith("http"):
        UPLOAD_IMG_DIR.mkdir(parents=True, exist_ok=True)
        hd_url = re.sub(r"\._AC_UL\d+_\.", "._AC_SL1500_.", img_url)
        for cand in [hd_url, img_url]:
            try:
                req = urllib.request.Request(cand, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    buf = resp.read()
                if len(buf) > 2000:
                    fname = f"{int(time.time() * 1000)}-{asin or 'find'}.jpg"
                    (UPLOAD_IMG_DIR / fname).write_bytes(buf)
                    local_img = f"/images/uploads/{fname}"
                    break
            except Exception:
                continue

    tag = (config.get("amazonAssociateTag") or "tidynestfi08f-20").strip()
    slug_base = re.sub(r"[^a-z0-9]+", "-", str(item.get("title", asin)).lower()).strip("-")[:72]
    existing_slugs = {p["slug"] for p in products}
    slug = slug_base
    suffix = 2
    while slug in existing_slugs:
        slug = f"{slug_base}-{suffix}"
        suffix += 1

    created = {
        "id": f"prod-{os.urandom(4).hex()}",
        "slug": slug,
        "title": str(item["title"]).strip(),
        "category": item.get("category", "kitchen"),
        "badge": item.get("badge", "Best Seller"),
        "affiliateUrl": f"https://www.amazon.com/dp/{asin}?tag={urllib.parse.quote(tag)}",
        "imageUrl": local_img,
        "shortPitch": str(item.get("shortPitch", "")).strip(),
        "highlights": item.get("highlights", []),
        "featured": True,
        "isSample": False,
        "ratingLabel": item.get("ratingLabel"),
        "estimatedPriceUsd": item.get("estimatedPriceUsd"),
        "commissionRatePercent": item.get("commissionRatePercent", 4.5 if item.get("category") == "kitchen" else 3.0),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    products = [created] + products
    save_json(PRODUCTS_PATH, products)
    print(f"[queue] Added queued product {created['title']} ({asin})")
    return products


def pick_next_product(products: list, published_data: dict):
    published_slugs = {row.get("slug") for row in published_data.get("published", [])}
    published_asins = {row.get("asin") for row in published_data.get("published", []) if row.get("asin")}
    real_products = [p for p in products if not p.get("isSample")]

    # Prefer higher commission & newest unpublished products first
    candidates = []
    for idx, p in enumerate(real_products):
        asin = extract_asin(p.get("affiliateUrl", ""))
        if p["slug"] in published_slugs or (asin and asin in published_asins):
            continue
        est_comm = float(p.get("estimatedPriceUsd") or 20) * float(p.get("commissionRatePercent") or 3.0) / 100.0
        candidates.append((est_comm, idx + 1, p))

    if not candidates:
        return None, None
    candidates.sort(key=lambda x: x[0], reverse=True)
    _, item_num, chosen = candidates[0]
    return item_num, chosen


def generate_script_with_gemini(product: dict, code: str) -> dict | None:
    if not GEMINI_API_KEY:
        return None
    prompt = f"""You are a viral US Amazon Finds YouTube Shorts scriptwriter.
Create a punchy, high-retention 20-second vertical Short script for this product:
- Title: {product['title']}
- Category: {product['category']}
- Badge: {product['badge']}
- Rating: {product.get('ratingLabel', 'Top Rated on Amazon US')}
- Pitch: {product['shortPitch']}
- Highlights: {'; '.join(product.get('highlights', [])[:3])}
- Bio Code: {code}

Return STRICT JSON only (no markdown fences) with these exact keys:
{{
  "yt_title": "Catchy <85 char YouTube Shorts title ending with #shorts #amazonfinds",
  "voiceover": "Natural, energetic 45-55 word US English voiceover ending with: Tap the link in our description or bio and search {code} to check today's Amazon price!",
  "veo_prompt": "Cinematic 9:16 vertical lifestyle b-roll prompt showing this home/kitchen product in a sunlit modern American home, warm aesthetic lighting, smooth slow camera push-in, no text",
  "scenes": [
    {{"badge": "SHORT BADGE", "headline": "5-8 word hook", "subline": "Short punchy line", "cta": "2-4 word pill"}},
    {{"badge": "SHORT BADGE", "headline": "Product reveal", "subline": "Key benefit", "cta": "2-4 word pill"}},
    {{"badge": "SOCIAL PROOF", "headline": "Why buyers love it", "subline": "Top highlight", "cta": "2-4 word pill"}},
    {{"badge": "SHOP FIND {code}", "headline": "Check Live Amazon Price", "subline": "Link in Description & Bio — search {code}", "cta": "SEARCH {code} IN BIO →"}}
  ]
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={urllib.parse.quote(GEMINI_API_KEY)}"
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.8},
        }
    ).encode("utf-8")

    try:
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        if parsed.get("voiceover") and isinstance(parsed.get("scenes"), list) and len(parsed["scenes"]) == 4:
            print("[gemini] Generated custom viral script via Gemini 2.5 Flash")
            return parsed
    except Exception as exc:
        print(f"[gemini] Fallback to built-in script engine ({exc})")
    return None


def fallback_script(product: dict, code: str) -> dict:
    title = product["title"]
    short_t = title if len(title) <= 52 else title[:49].rstrip() + "..."
    rating = product.get("ratingLabel") or f"{product['badge']} on Amazon US"
    highlight = (product.get("highlights") or ["Designed for effortless clutter-free living"])[0]
    short_hl = highlight if len(highlight) <= 85 else highlight[:82].rstrip() + "..."

    return {
        "yt_title": f"{short_t} ({product['badge']}) 🔥 #shorts #amazonfinds",
        "voiceover": (
            f"Stop scrolling if you love smart home upgrades! "
            f"Meet Find {code}: {short_t}. {product['shortPitch']} "
            f"Shoppers are obsessed with {rating}. "
            f"Tap the link in our description or bio and search {code} to check today's live price on Amazon!"
        ),
        "veo_prompt": (
            f"Cinematic 9:16 vertical lifestyle video of {short_t} in a bright, sunlit modern American home, "
            "clean aesthetic styling, smooth slow camera push-in, warm editorial lighting, photorealistic, no text"
        ),
        "scenes": [
            {
                "badge": f"AMAZON FIND {code}",
                "headline": "The Amazon Upgrade Everyone Is Saving",
                "subline": rating,
                "cta": "Watch Before You Buy →",
            },
            {
                "badge": product["badge"].upper(),
                "headline": short_t,
                "subline": product["shortPitch"][:96],
                "cta": "4.5★+ Amazon Favorite",
            },
            {
                "badge": "WHY IT'S VIRAL",
                "headline": rating,
                "subline": short_hl,
                "cta": "Instant Home Upgrade",
            },
            {
                "badge": f"SHOP FIND {code}",
                "headline": "Check Today's Live Price on Amazon",
                "subline": f"Link in Description & Bio — search {code}",
                "cta": f"SEARCH {code} IN BIO →",
            },
        ],
    }


def try_generate_veo3_clip(veo_prompt: str, out_mp4: Path) -> bool:
    """Optional Google Veo 3 cinematic 9:16 clip generator via Gemini API."""
    if not (GEMINI_API_KEY and ENABLE_VEO3):
        return False

    print("[veo3] Requesting cinematic 9:16 video generation via veo-3.0-generate-001...")
    start_url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"veo-3.0-generate-001:predictLongRunning?key={urllib.parse.quote(GEMINI_API_KEY)}"
    )
    payload = json.dumps(
        {
            "instances": [{"prompt": veo_prompt}],
            "parameters": {"aspectRatio": "9:16", "durationSeconds": 8},
        }
    ).encode("utf-8")

    try:
        req = urllib.request.Request(start_url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            op = json.loads(resp.read().decode("utf-8"))
        op_name = op.get("name")
        if not op_name:
            return False

        poll_url = f"https://generativelanguage.googleapis.com/v1beta/{op_name}?key={urllib.parse.quote(GEMINI_API_KEY)}"
        for _ in range(36):  # Up to 3 minutes
            time.sleep(5)
            with urllib.request.urlopen(poll_url, timeout=20) as p_resp:
                status = json.loads(p_resp.read().decode("utf-8"))
            if not status.get("done"):
                continue
            videos = (
                status.get("response", {})
                .get("generateVideoResponse", {})
                .get("generatedSamples", [])
            )
            if not videos:
                return False
            video_uri = videos[0].get("video", {}).get("uri")
            if not video_uri:
                return False
            dl_url = f"{video_uri}&key={urllib.parse.quote(GEMINI_API_KEY)}" if "?" in video_uri else f"{video_uri}?key={urllib.parse.quote(GEMINI_API_KEY)}"
            with urllib.request.urlopen(dl_url, timeout=60) as v_resp:
                out_mp4.write_bytes(v_resp.read())
            print(f"[veo3] Downloaded Veo 3 clip: {out_mp4.stat().st_size} bytes")
            return out_mp4.stat().st_size > 10_000
    except Exception as exc:
        print(f"[veo3] Falling back to Pro Studio renderer ({exc})")
    return False


def load_font(size: int, bold: bool = True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size=size)
    return ImageFont.load_default()


def render_studio_short(product: dict, script: dict, out_mp4: Path, base_url: str):
    font_badge = load_font(34, True)
    font_head = load_font(58, True)
    font_sub = load_font(34, False)
    font_cta = load_font(38, True)
    font_footer = load_font(28, True)

    theme = {
        "bg": "#151210",
        "bg2": "#211C18",
        "card": "#26211D",
        "border": "#3E362F",
        "ink": "#FAF6F0",
        "sub_ink": "#D4C8B9",
        "accent": "#E5956E",
        "accent_text": "#181512",
        "bar_bg": "#3D352E",
        "cta_bg": "#E5956E",
        "cta_text": "#181512",
    }

    audio_path = WORK_DIR / "voiceover.mp3"
    asyncio.run(
        edge_tts.Communicate(script["voiceover"], voice="en-US-JennyNeural", rate="+6%").save(str(audio_path))
    )

    probe = subprocess.run([FFMPEG, "-i", str(audio_path)], capture_output=True, text=True)
    dur = 18.0
    for line in probe.stderr.splitlines():
        if "Duration:" in line:
            hh, mm, ss = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = float(hh) * 3600 + float(mm) * 60 + float(ss)
            break

    img_rel = product["imageUrl"].lstrip("/")
    img_path = PUBLIC_DIR / img_rel
    if not img_path.exists():
        raise FileNotFoundError(f"Product image missing: {img_path}")

    scenes = script["scenes"]
    sec_per_scene = max(3.0, (dur + 0.5) / len(scenes))
    host_label = base_url.replace("https://", "").replace("http://", "").rstrip("/")
    scene_parts = []

    for idx, sc in enumerate(scenes):
        png_path = WORK_DIR / f"scene_{idx}.png"
        mp4_part = WORK_DIR / f"scene_{idx}.mp4"
        W, H = 1080, 1920
        canvas = Image.new("RGB", (W, H), theme["bg"])
        draw = ImageDraw.Draw(canvas)
        draw.rectangle([0, 1180, W, H], fill=theme["bg2"])

        pad, gap = 56, 14
        seg_w = (W - pad * 2 - gap * (len(scenes) - 1)) // len(scenes)
        for i in range(len(scenes)):
            x0 = pad + i * (seg_w + gap)
            draw.rounded_rectangle([x0, 70, x0 + seg_w, 82], radius=6, fill=theme["accent"] if i <= idx else theme["bar_bg"])

        bt = str(sc.get("badge", "AMAZON FIND")).upper()
        bb = draw.textbbox((0, 0), bt, font=font_badge)
        bw = (bb[2] - bb[0]) + 72
        bx = (W - bw) // 2
        draw.rounded_rectangle([bx, 128, bx + bw, 198], radius=35, fill=theme["accent"])
        draw.text((W // 2, 163), bt, font=font_badge, fill=theme["accent_text"], anchor="mm")

        fx, fy, fw, fh = 80, 244, W - 160, 890
        draw.rounded_rectangle([fx - 4, fy - 4, fx + fw + 4, fy + fh + 4], radius=44, fill=theme["border"])
        img = Image.open(img_path).convert("RGB")
        iw, ih = img.size
        scale = max(fw / iw, fh / ih) * (1.0 + idx * 0.04)
        nw, nh = int(iw * scale), int(ih * scale)
        resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
        cropped = resized.crop(((nw - fw) // 2, (nh - fh) // 2, (nw - fw) // 2 + fw, (nh - fh) // 2 + fh))
        mask = Image.new("L", (fw, fh), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, fw, fh], radius=40, fill=255)
        canvas.paste(cropped, (fx, fy), mask)

        cx0, cy0, cx1, cy1 = 64, 1186, W - 64, 1740
        draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=40, fill=theme["card"])

        y = cy0 + 58
        for line in textwrap.wrap(str(sc.get("headline", "")), width=23)[:3]:
            draw.text((W // 2, y), line, font=font_head, fill=theme["ink"], anchor="ma")
            y += 72

        y += 20
        for line in textwrap.wrap(str(sc.get("subline", "")), width=36)[:3]:
            draw.text((W // 2, y), line, font=font_sub, fill=theme["sub_ink"], anchor="ma")
            y += 48

        cta = str(sc.get("cta", ""))
        if cta:
            cb = draw.textbbox((0, 0), cta, font=font_cta)
            cw = min(W - 180, (cb[2] - cb[0]) + 84)
            clx = (W - cw) // 2
            draw.rounded_rectangle([clx, cy1 - 118, clx + cw, cy1 - 42], radius=38, fill=theme["cta_bg"])
            draw.text((W // 2, cy1 - 80), cta, font=font_cta, fill=theme["cta_text"], anchor="mm")

        draw.text((W // 2, 1810), f"TidyNest Finds  •  {host_label}/links", font=font_footer, fill=theme["sub_ink"], anchor="mm")
        canvas.save(png_path, "PNG")

        frames = int(sec_per_scene * 30)
        vf = f"zoompan=z='min(zoom+0.0012,1.08)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p"
        subprocess.run(
            [FFMPEG, "-y", "-loop", "1", "-i", str(png_path), "-vf", vf, "-t", f"{sec_per_scene:.2f}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", str(mp4_part)],
            check=True,
            capture_output=True,
        )
        scene_parts.append(mp4_part)

    concat_txt = WORK_DIR / "concat.txt"
    concat_txt.write_text("\n".join(f"file '{p.as_posix()}'" for p in scene_parts), encoding="utf-8")

    subprocess.run(
        [
            FFMPEG, "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_txt),
            "-i", str(audio_path),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-shortest", "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
        capture_output=True,
    )
    print(f"[studio] Built 1080x1920 Short: {out_mp4} ({out_mp4.stat().st_size} bytes)")


def upload_to_youtube(mp4_path: Path, title: str, description: str) -> str | None:
    if not (YT_CLIENT_ID and YT_CLIENT_SECRET and YT_REFRESH_TOKEN):
        print("[youtube] Missing YOUTUBE_CLIENT_ID / SECRET / REFRESH_TOKEN — skipping API upload.")
        return None

    # 1. Exchange refresh token for access token
    token_data = urllib.parse.urlencode(
        {
            "client_id": YT_CLIENT_ID,
            "client_secret": YT_CLIENT_SECRET,
            "refresh_token": YT_REFRESH_TOKEN,
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=token_data, method="POST")
    with urllib.request.urlopen(req, timeout=20) as resp:
        access_token = json.loads(resp.read().decode("utf-8"))["access_token"]

    # 2. Initiate resumable YouTube Data API v3 upload
    metadata = json.dumps(
        {
            "snippet": {
                "title": title[:100],
                "description": description[:4900],
                "tags": ["shorts", "amazonfinds", "amazonmusthaves", "homeorganization", "kitchenfinds"],
                "categoryId": "26",  # Howto & Style
                "defaultLanguage": "en",
                "defaultAudioLanguage": "en-US",
            },
            "status": {
                "privacyStatus": "public",
                "selfDeclaredMadeForKids": False,
            },
        }
    ).encode("utf-8")

    init_req = urllib.request.Request(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        data=metadata,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(mp4_path.stat().st_size),
            "X-Upload-Content-Type": "video/mp4",
        },
        method="POST",
    )
    with urllib.request.urlopen(init_req, timeout=30) as init_resp:
        upload_url = init_resp.headers.get("Location")
    if not upload_url:
        raise RuntimeError("YouTube resumable upload did not return Location header")

    # 3. Upload MP4 bytes
    video_bytes = mp4_path.read_bytes()
    put_req = urllib.request.Request(
        upload_url,
        data=video_bytes,
        headers={"Content-Type": "video/mp4", "Content-Length": str(len(video_bytes))},
        method="PUT",
    )
    with urllib.request.urlopen(put_req, timeout=180) as put_resp:
        result = json.loads(put_resp.read().decode("utf-8"))
    video_id = result.get("id")
    print(f"[youtube] PUBLISHED LIVE SHORT: https://youtube.com/shorts/{video_id}")
    return video_id


def main():
    config = load_json(CONFIG_PATH, {})
    base_url = (config.get("baseUrl") or "https://tidynest-finds-515f.vercel.app").rstrip("/")
    products = load_json(PRODUCTS_PATH, [])
    published_data = load_json(PUBLISHED_PATH, {"published": []})

    products = pop_from_queue_if_any(products, config)
    item_num, product = pick_next_product(products, published_data)
    if not product:
        print("[autopilot] All products already have YouTube Shorts published! Add new items to data/auto-queue.json.")
        return

    code = f"#{item_num:02d}"
    asin = extract_asin(product.get("affiliateUrl", ""))
    print(f"[autopilot] Selected product {code}: {product['title']} ({asin})")

    script = generate_script_with_gemini(product, code) or fallback_script(product, code)
    out_mp4 = WORK_DIR / f"{product['slug']}.mp4"

    # Try Veo 3 first if explicitly enabled, else Pro Studio 1080x1920 renderer
    used_veo3 = try_generate_veo3_clip(script.get("veo_prompt", ""), out_mp4)
    if not used_veo3:
        render_studio_short(product, script, out_mp4, base_url)

    description = (
        f"Shop Find {code} ({product['title']}):\n"
        f"{base_url}/finds/{product['slug']}\n\n"
        f"Browse all curated Amazon US Home & Kitchen finds (search {code}):\n"
        f"{base_url}/links\n\n"
        f"{config.get('disclosureText', 'As an Amazon Associate I earn from qualifying purchases.')}\n"
        "#shorts #amazonfinds #amazonmusthaves #homeorganization #kitchenfinds"
    )

    video_id = upload_to_youtube(out_mp4, script["yt_title"], description)
    if video_id:
        published_data.setdefault("published", []).append(
            {
                "asin": asin,
                "slug": product["slug"],
                "youtubeVideoId": video_id,
                "engine": "veo3" if used_veo3 else "studio-tts",
                "publishedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
        save_json(PUBLISHED_PATH, published_data)
    else:
        print("[autopilot] Video rendered cleanly (dry run — add YouTube OAuth secrets in GitHub to auto-publish).")


if __name__ == "__main__":
    main()
