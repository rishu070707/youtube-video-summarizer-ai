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
    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const jobId = Date.now().toString();
    const base = `audio-${jobId}`;
    const outTemplate = path.join(TMP, `${base}.%(ext)s`);
    const audioFile = path.join(TMP, `${base}.mp3`);

    console.log("▶️ Starting yt-dlp for:", url);

    const yt = spawn(YTDLP, [
      "-f", "ba",
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "5",
      "--no-playlist",
      "-o", outTemplate,
      url
    ]);

    yt.stderr.on("data", (data) => {
      console.error("yt-dlp stderr:", data.toString());
    });

    yt.on("error", (err) => {
      console.error("❌ yt-dlp spawn error:", err);
      return res.status(500).json({ error: "yt-dlp execution failed" });
    });

    yt.on("close", async (code) => {
      if (code !== 0) {
        console.error("❌ yt-dlp exited with code:", code);
        return res.status(500).json({ error: "yt-dlp failed" });
      }

      if (!fs.existsSync(audioFile)) {
        console.error("❌ MP3 not found after yt-dlp");
        return res.status(500).json({ error: "Audio extraction failed" });
      }

      try {
        // Upload to Cloudinary
        const upload = await cloudinary.uploader.upload(audioFile, {
          resource_type: "video",
          folder: "yt-audio",
        });

        // Save job
        await Job.create({
          jobId,
          youtubeUrl: url,
          audioUrl: upload.secure_url,
          status: "processing",
        });

        fs.unlinkSync(audioFile);

        return res.json({
          jobId,
          message: "Audio processed & uploaded",
        });
      } catch (err) {
        console.error("❌ Cloudinary / DB error:", err);
        return res.status(500).json({ error: "Upload failed" });
      }
    });

  } catch (err) {
    console.error("❌ Submit route crashed:", err);
    return res.status(500).json({ error: "Internal server error" });
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
