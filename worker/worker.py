#!/usr/bin/env python3
"""
AI Video Summarizer Worker — CLOUD VERSION
------------------------------------------
✔ MongoDB based job state
✔ Cloudinary audio input
✔ OpenAI Whisper transcription
✔ Gemini Flash Lite summary
✔ Stateless / Cloud safe
"""

from __future__ import annotations
import os
import sys
import tempfile
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

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
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="ignore"))

# -------------------------------
# DB CONNECT
# -------------------------------
client = MongoClient(MONGO_URI)
db = client["test"]
jobs = db["jobs"]

# -------------------------------
# GEMINI
# -------------------------------
def summarize_with_gemini(text: str) -> str:
    if not text.strip():
        return "No spoken content."

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel("models/gemini-flash-lite-latest")
        resp = model.generate_content(
            "Summarize this video clearly in 2–3 sentences:\n\n" + text[:3500]
        )
        return resp.text.strip()

    except Exception as e:
        safe_print("Gemini error:", e)
        return "Summary unavailable."

# -------------------------------
# TRANSCRIBE
# -------------------------------
def transcribe_audio(audio_path: str) -> str:
    import whisper
    model = whisper.load_model("tiny")
    result = model.transcribe(audio_path)
    return result.get("text", "")

# -------------------------------
# MAIN JOB PROCESSOR
# -------------------------------
def process_job(job_id: str):
    safe_print("▶ Processing job:", job_id)

    job = jobs.find_one({"jobId": job_id})
    if not job:
        safe_print("❌ Job not found")
        return

    audio_url = job.get("audioUrl")
    if not audio_url:
        safe_print("❌ audioUrl missing")
        jobs.update_one(
            {"jobId": job_id},
            {"$set": {"status": "failed"}}
        )
        return

    # ---------------------------
    # DOWNLOAD AUDIO (TEMP FILE)
    # ---------------------------
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
        audio_path = f.name
        r = requests.get(audio_url)
        f.write(r.content)

    # ---------------------------
    # TRANSCRIBE
    # ---------------------------
    safe_print("🎧 Transcribing...")
    transcript = transcribe_audio(audio_path)

    # ---------------------------
    # SUMMARY
    # ---------------------------
    safe_print("🧠 Summarizing...")
    summary = summarize_with_gemini(transcript)

    # ---------------------------
    # UPDATE DB
    # ---------------------------
    jobs.update_one(
        {"jobId": job_id},
        {"$set": {
            "status": "completed",
            "summary": summary
        }}
    )

    os.remove(audio_path)
    safe_print("✅ Job completed:", job_id)

# -------------------------------
# CLI ENTRY
# -------------------------------
import time

if __name__ == "__main__":
    safe_print("🚀 Worker started and listening for jobs")

    while True:
        job = jobs.find_one({"status": "pending"})

        if job:
            try:
                jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"status": "processing"}}
                )
                process_job(job["jobId"])
            except Exception as e:
                safe_print("❌ Job error:", e)
                jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"status": "failed"}}
                )
        else:
            time.sleep(5)

