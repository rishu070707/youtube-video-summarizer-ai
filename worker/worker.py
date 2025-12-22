#!/usr/bin/env python3
"""
AI Video Summarizer Worker — FINAL FIXED VERSION
------------------------------------------------
✔ Single video only (playlist/radio blocked)
✔ REAL transcription using OpenAI Whisper
✔ Gemini Flash Lite (FREE)
✔ Windows-safe logging
✔ Backend compatible
✔ Saves results to: work/<userId>/<jobId>/results.json
"""

from __future__ import annotations
import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from typing import List, Dict


# =======================================================
# SAFE PRINT (Windows Unicode-safe)
# =======================================================

def safe_print(*args):
    msg = " ".join(str(a) for a in args)
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="ignore"))


# =======================================================
# CLEAN YOUTUBE URL (remove playlist/radio)
# =======================================================

def clean_youtube_url(url: str) -> str:
    if "&list=" in url:
        return url.split("&list=")[0]
    return url


# =======================================================
# FFmpeg Finder
# =======================================================

def find_ffmpeg():
    ff = shutil.which("ffmpeg")
    if ff:
        return ff

    local_ff = Path(
        os.getenv("LOCALAPPDATA", ""),
        "ffmpegio", "ffmpeg-downloader", "ffmpeg", "bin", "ffmpeg.exe"
    )
    return str(local_ff) if local_ff.exists() else None


# =======================================================
# DOWNLOAD VIDEO (yt-dlp) — SINGLE VIDEO ONLY
# =======================================================

def download_video(url: str, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        import yt_dlp
        safe_print("Downloading video...")

        opts = {
            "format": "best",
            "outtmpl": str(out_path),
            "noplaylist": True,     # 🔥 IMPORTANT FIX
            "quiet": True,
            "no_warnings": True
        }

        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

        return out_path if out_path.exists() else None

    except Exception as e:
        safe_print("yt-dlp failed:", e)
        return None


# =======================================================
# AUDIO EXTRACTION
# =======================================================

def extract_audio(video_path: Path, audio_path: Path):
    ff = find_ffmpeg()
    if not ff:
        raise RuntimeError("FFmpeg not found")

    cmd = [
        ff, "-y",
        "-i", str(video_path),
        "-vn",
        "-acodec", "pcm_s16le",
        str(audio_path)
    ]

    subprocess.run(cmd, capture_output=True)
    return audio_path.exists()


# =======================================================
# TRANSCRIPTION — OpenAI Whisper ONLY
# =======================================================

def transcribe_audio(audio_path: Path):
    safe_print("Transcribing audio...")

    try:
        import whisper
    except ImportError:
        raise RuntimeError("openai-whisper not installed")

    if not hasattr(whisper, "load_model"):
        raise RuntimeError(
            "Invalid whisper module.\n"
            "Run:\n"
            "pip uninstall faster-whisper whisperx -y\n"
            "pip install openai-whisper"
        )

    model = whisper.load_model("tiny")
    result = model.transcribe(str(audio_path))

    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": int(seg["start"]),
            "end": int(seg["end"]),
            "text": seg["text"].strip()
        })

    return segments


# =======================================================
# SCENE SPLIT (15s chunks)
# =======================================================

def detect_scenes(duration: int, chunk: int = 15):
    scenes = []
    i = 1
    for start in range(0, duration, chunk):
        scenes.append({
            "id": f"s{i}",
            "start": start,
            "end": min(start + chunk, duration)
        })
        i += 1
    return scenes


# =======================================================
# GEMINI SUMMARY
# =======================================================

GEMINI_MODEL = "models/gemini-flash-lite-latest"

def summarize_with_gemini(text: str):
    if not text.strip():
        return "No spoken content."

    from google import genai

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return "Missing Gemini API key."

    client = genai.Client(api_key=api_key)

    prompt = (
        "Summarize the following video content clearly in 1–2 sentences:\n\n"
        + text[:3500]
    )

    try:
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return resp.text.strip()
    except Exception as e:
        safe_print("Gemini error:", e)
        return "Summary unavailable."


# =======================================================
# JOB PROCESSOR
# =======================================================

def process_job(job: Dict):
    safe_print("Processing job:", job)

    url = clean_youtube_url(job["url"])
    userId = job["userId"]
    jobId = job["jobId"]

    outdir = Path("work") / userId / jobId
    outdir.mkdir(parents=True, exist_ok=True)

    video_path = outdir / "video.mp4"
    audio_path = outdir / "audio.wav"

    # DOWNLOAD
    if not download_video(url, video_path):
        safe_print("Download failed")
        return

    # AUDIO
    extract_audio(video_path, audio_path)

    # TRANSCRIBE
    segments = transcribe_audio(audio_path)
    json.dump(segments, open(outdir / "transcript.json", "w", encoding="utf-8"), indent=2)

    if not segments:
        safe_print("No speech detected")
        return

    # SCENES
    duration = max(s["end"] for s in segments)
    scenes = detect_scenes(duration)

    for s in scenes:
        s["transcript"] = " ".join(
            seg["text"]
            for seg in segments
            if s["start"] <= seg["start"] < s["end"]
        )
        s["summary"] = summarize_with_gemini(s["transcript"])

    # SAVE RESULT
    results = {
        "video": str(video_path),
        "scenes": scenes
    }

    json.dump(results, open(outdir / "results.json", "w", encoding="utf-8"), indent=2)
    safe_print("Job completed successfully.")


# =======================================================
# CLI ENTRY
# =======================================================

if __name__ == "__main__":
    if len(sys.argv) < 4:
        safe_print("Usage: python worker.py <url> <jobId> <userId>")
        sys.exit(1)

    process_job({
        "url": sys.argv[1],
        "jobId": sys.argv[2],
        "userId": sys.argv[3]
    })

    safe_print("Worker finished.")
