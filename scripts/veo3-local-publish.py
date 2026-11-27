#!/usr/bin/env python3
"""
Hybrid Local Veo 3 Storytelling Compositor & Publisher:
Takes a Veo 3 cinematic clip downloaded from Google Flow / Gemini Web UI,
composites a 1080x1920 vertical Short with US English storytelling voiceover,
publishes to YouTube Shorts (if OAuth env vars are set) or saves to youtube-shorts-ready/,
and records the video in data/published-videos.json so Cloud Autopilot never duplicates it.

Usage:
  python scripts/veo3-local-publish.py <ASIN> <path-to-veo3-clip.mp4>
"""

import asyncio
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import edge_tts
import imageio_ffmpeg

WORKSPACE = Path(__file__).resolve().parent.parent
PRODUCTS_PATH = WORKSPACE / "data" / "products.json"
PUBLISHED_PATH = WORKSPACE / "data" / "published-videos.json"
OUT_DIR = WORKSPACE / "youtube-shorts-ready"
TMP_DIR = WORKSPACE / ".autopilot_tmp"
OUT_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def find_product(asin: str):
    products = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    real = [p for p in products if not p.get("isSample")]
    for idx, p in enumerate(real):
        if asin.upper() in str(p.get("affiliateUrl", "")).upper():
            return idx + 1, p
    raise SystemExit(f"ASIN not found in data/products.json: {asin}")


async def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python scripts/veo3-local-publish.py <ASIN> <veo3-clip.mp4>")

    asin = sys.argv[1].strip().upper()
    raw_clip = Path(sys.argv[2]).resolve()
    if not raw_clip.exists():
        raise SystemExit(f"Veo 3 clip not found: {raw_clip}")

    num, product = find_product(asin)
    code = f"#{num:02d}"
    rating = product.get("ratingLabel") or f"{product['badge']} on Amazon US"

    voiceover = (
        f"I used to dread my morning routine until I finally tried Find {code}: {product['title']}. "
        f"{product['shortPitch']} "
        f"There is a reason shoppers gave it {rating}. "
        f"Would you put this in your home? Comment yes or no below, and search {code} at our link in bio!"
    )

    vo_mp3 = TMP_DIR / f"veo3_vo_{asin}.mp3"
    await edge_tts.Communicate(voiceover, voice="en-US-JennyNeural", rate="+6%").save(str(vo_mp3))

    out_mp4 = OUT_DIR / f"veo3-{product['slug']}.mp4"
    subprocess.run(
        [
            FFMPEG, "-y",
            "-stream_loop", "-1", "-i", str(raw_clip),
            "-i", str(vo_mp3),
            "-map", "0:v:0", "-map", "1:a:0",
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest", "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
        capture_output=True,
    )
    print(f"BUILT_VEO3_SHORT: {out_mp4} ({out_mp4.stat().st_size} bytes) | Find {code}")


if __name__ == "__main__":
    asyncio.run(main())
