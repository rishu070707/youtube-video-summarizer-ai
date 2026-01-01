const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const cleanUrl = require("../utils/cleanUrl");

/* =========================
   SUBMIT VIDEO (TEXT ONLY)
========================= */
router.post("/submit", async (req, res) => {
  const url = cleanUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "URL required" });

  const jobId = Date.now().toString();

  await Job.create({
    jobId,
    youtubeUrl: url,
    status: "completed",
    summary: "⚠️ Demo summary placeholder. AI logic goes here.",
  });

  res.json({ jobId });
});

/* =========================
   GET RESULT
========================= */
router.get("/result/:jobId", async (req, res) => {
  const job = await Job.findOne({ jobId: req.params.jobId });

  if (!job) return res.json({ ready: false });

  res.json({
    ready: true,
    data: job.summary,
  });
});

module.exports = router;
