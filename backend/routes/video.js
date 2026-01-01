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

/* =========================
   SUBMIT VIDEO
========================= */
router.post("/submit", async (req, res) => {
  const url = cleanUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "URL required" });

  const jobId = Date.now().toString();
  const base = `audio-${jobId}`;
  const outTemplate = path.join(TMP, `${base}.%(ext)s`);
  const audioFile = path.join(TMP, `${base}.mp3`);

  try {
    // 1️⃣ Extract audio using yt-dlp binary
    const yt = spawn("yt-dlp", [
      "-f", "ba",
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "5",
      "--no-playlist",
      "-o", outTemplate,
      url
    ]);

    yt.on("error", err => {
      console.error(err);
      return res.status(500).json({ error: "yt-dlp failed" });
    });

    yt.on("close", async () => {
      if (!fs.existsSync(audioFile)) {
        return res.status(500).json({ error: "Audio extraction failed" });
      }

      // 2️⃣ Upload to Cloudinary
      const upload = await cloudinary.uploader.upload(audioFile, {
        resource_type: "video",
        folder: "yt-audio",
      });

      // 3️⃣ Save job
      await Job.create({
        jobId,
        youtubeUrl: url,
        audioUrl: upload.secure_url,
        status: "processing",
      });

      fs.unlinkSync(audioFile);

      res.json({
        jobId,
        message: "Audio processed & uploaded",
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

/* =========================
   GET RESULT
========================= */
router.get("/result/:jobId", async (req, res) => {
  const job = await Job.findOne({ jobId: req.params.jobId });

  if (!job || job.status !== "completed") {
    return res.json({ ready: false });
  }

  res.json({
    ready: true,
    data: job.summary,
  });
});

module.exports = router;
