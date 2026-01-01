const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const cleanUrl = require("../utils/cleanUrl");

/* =========================
   SUBMIT VIDEO (NO DOWNLOAD)
========================= */
router.post("/submit", async (req, res) => {
  const url = cleanUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "URL required" });

  const jobId = Date.now().toString();

  await Job.create({
    jobId,
    youtubeUrl: url,
    status: "processing",
  });

  // 🔥 simulate AI summary (replace with real AI later)
  setTimeout(async () => {
    await Job.updateOne(
      { jobId },
      {
        status: "completed",
        summary: "This is an AI-generated summary of the video.",
      }
    );
  }, 3000);

  res.json({ jobId });
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
    summary: job.summary,
    youtubeUrl: job.youtubeUrl,
  });
});

module.exports = router;
