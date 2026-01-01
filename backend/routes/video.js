const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const cloudinary = require("../config/cloudinary");
const Job = require("../models/Job");
const cleanUrl = require("../utils/cleanUrl");

const TMP = path.join(__dirname, "../tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const YTDLP = "yt-dlp";

/* =========================
   SUBMIT VIDEO
========================= */
router.post("/submit", async (req, res) => {
  try {
    const url = cleanUrl(req.body.url);
    if (!url) return res.status(400).json({ error: "URL required" });

    const jobId = Date.now().toString();
    const base = `audio-${jobId}`;
    const audioFile = path.join(TMP, `${base}.mp3`);

    const yt = spawn("yt-dlp", [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "5",
      "--no-playlist",
      "-o", audioFile,
      url
    ]);

    yt.on("error", (err) => {
      console.error("yt-dlp error:", err);
      return res.status(500).json({ error: "yt-dlp failed" });
    });

    yt.on("close", async (code) => {
      if (code !== 0 || !fs.existsSync(audioFile)) {
        return res.status(500).json({ error: "Audio extraction failed" });
      }

      const upload = await cloudinary.uploader.upload(audioFile, {
        resource_type: "video",
        folder: "yt-audio",
      });

      await Job.create({
        jobId,
        youtubeUrl: url,
        audioUrl: upload.secure_url,
        status: "processing",
      });

      fs.unlinkSync(audioFile);

      res.json({ jobId });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submit failed" });
  }
});


/* =========================
   GET RESULT
========================= */
router.get("/result/:jobId", async (req, res) => {
  try {
    const job = await Job.findOne({ jobId: req.params.jobId });

    if (!job || job.status !== "completed") {
      return res.json({ ready: false });
    }

    return res.json({
      ready: true,
      data: job.summary,
    });
  } catch (err) {
    console.error("❌ Result fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch result" });
  }
});

module.exports = router;
