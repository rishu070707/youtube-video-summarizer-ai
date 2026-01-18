#!/usr/bin/env python3
"""
AI Video Summarizer Worker — CAPTIONS ONLY (FREE)
-------------------------------------------------
✔ MongoDB job queue
✔ YouTube captions (no audio)
✔ Gemini Flash Lite summary
✔ Railway safe
✔ 100% free
"""

from __future__ import annotations
import os
import time
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from youtube_transcript_api import YouTubeTranscriptApi

# -------------------------------
# ENV
# -------------------------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not MONGO_URI:
    print("❌ MONGO_URI missing")
    sys.exit(1)

# -------------------------------
# SAFE PRINT
# -------------------------------
def safe_print(*args):
    msg = " ".join(str(a) for a in args)
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()

# -------------------------------
# DB CONNECT
# -------------------------------
client = MongoClient(MONGO_URI)
db = client["test"]
jobs = db["jobs"]

# -------------------------------
# GEMINI SUMMARY
# -------------------------------
def summarize_with_gemini(text: str) -> str:
    if not text.strip():
        return "No captions available for this video."

    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel(
            "models/gemini-flash-lite-latest"
        )

        prompt = (
            "Summarize this YouTube video clearly in 3–5 bullet points:\n\n"
            + text[:3500]
        )

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        safe_print("❌ Gemini error:", e)
        return "Summary unavailable."

# -------------------------------
# YOUTUBE CAPTIONS
# -------------------------------
def fetch_captions(video_id: str) -> str:
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([x["text"] for x in transcript])
    except Exception as e:
        safe_print("❌ Caption error:", e)
        return ""

# -------------------------------
# JOB PROCESSOR
# -------------------------------
def process_job(job):
    job_id = job["jobId"]
    video_id = job.get("videoId")

    safe_print("▶ Processing job:", job_id)

    if not video_id:
        safe_print("❌ videoId missing")
        jobs.update_one(
            {"_id": job["_id"]},
            {"$set": {"status": "failed"}}
        )
        return

    safe_print("📺 Fetching captions...")
    transcript = fetch_captions(video_id)

    safe_print("🧠 Summarizing with Gemini...")
    summary = summarize_with_gemini(transcript)

    jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            "status": "completed",
            "summary": summary
        }}
    )

    safe_print("✅ Job completed:", job_id)

# -------------------------------
# WORKER LOOP
# -------------------------------
if __name__ == "__main__":
    safe_print("🚀 Caption Worker started")

    while True:
        job = jobs.find_one({"status": "pending"})

        if job:
            try:
                jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"status": "processing"}}
                )
                process_job(job)
            except Exception as e:
                safe_print("❌ Worker error:", e)
                jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"status": "failed"}}
                )
        else:
            time.sleep(5)
