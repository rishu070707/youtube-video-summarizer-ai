const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

// ---------------------------
// SUBMIT JOB
// ---------------------------
router.post("/submit", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const jobId = Date.now().toString();
  const userId = "demo";

  // ✅ ABSOLUTE CORRECT PATH
  const workerPath = path.resolve(
    __dirname,
    "..",
    "..",
    "worker",
    "worker.py"
  );

  console.log("Worker path:", workerPath);

  exec(
    `python "${workerPath}" "${url}" "${jobId}" "${userId}"`,
    (err, stdout, stderr) => {
      if (err) {
        console.error("Worker error:", err);
        console.error(stderr);
      } else {
        console.log(stdout);
      }
    }
  );

  res.json({ jobId, message: "Processing started" });
});

// ---------------------------
// FETCH RESULTS
// ---------------------------
router.get("/result/:jobId", (req, res) => {
  const jobId = req.params.jobId;

  const resultPath = path.resolve(
    __dirname,
    "..",
    "..",
    "worker",
    "work",
    "demo",
    jobId,
    "results.json"
  );

  if (!fs.existsSync(resultPath)) {
    return res.json({ ready: false });
  }

  const data = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  res.json({ ready: true, data });
});

module.exports = router;
