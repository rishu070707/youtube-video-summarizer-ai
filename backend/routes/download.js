const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const cleanUrl = require("../utils/cleanUrl");

const TMP = path.join(__dirname, "../tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const YTDLP = "yt-dlp";

/* ================= AUDIO (MP3) ================= */
router.get("/audio", (req, res) => {
  const url = cleanUrl(req.query.url);
  if (!url) return res.status(400).send("URL required");

  const base = `audio-${Date.now()}`;
  const outTemplate = path.join(TMP, `${base}.%(ext)s`);
  const finalFile = path.join(TMP, `${base}.mp3`);

  const yt = spawn(YTDLP, [
    "-f", "ba",
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "--playlist-items", "1",
    "--no-part",
    "-o", outTemplate,
    url
  ]);

  yt.on("error", err => {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("yt-dlp failed");
    }
  });

  yt.on("close", () => {
    if (!fs.existsSync(finalFile) || fs.statSync(finalFile).size === 0) {
      return res.status(500).send("Audio download failed");
    }

    res.download(finalFile, "audio.mp3", () => {
      fs.unlinkSync(finalFile);
    });
  });
});

/* ================= VIDEO (720p + AUDIO + SMALL SIZE) ================= */
/* ================= VIDEO (720p + AUDIO + SMALL SIZE | FIXED) ================= */
router.get("/video", (req, res) => {
  const url = cleanUrl(req.query.url);
  if (!url) return res.status(400).send("URL required");

  const base = `video-${Date.now()}`;
  const outTemplate = path.join(TMP, `${base}.%(ext)s`);
  const finalFile = path.join(TMP, `${base}.mp4`);

  const yt = spawn(YTDLP, [
    // ✅ Best video+audio up to 720p (NO container restriction)
    "-f",
    "bv*[height<=720]+ba/b[height<=720]",

    // ✅ Force MP4 output
    "--merge-output-format", "mp4",

    // ✅ Smaller file size
    "--postprocessor-args",
    "ffmpeg:-movflags +faststart -preset veryfast -crf 28",

    "--playlist-items", "1",
    "--no-part",
    "-o", outTemplate,
    url
  ]);

  yt.stderr.on("data", d => console.log(d.toString())); // helpful debug

  yt.on("error", err => {
    console.error(err);
    if (!res.headersSent) res.status(500).send("yt-dlp failed");
  });

  yt.on("close", () => {
    if (!fs.existsSync(finalFile) || fs.statSync(finalFile).size === 0) {
      return res.status(500).send("Video download failed");
    }

    res.download(finalFile, "video-720p.mp4", () => {
      fs.unlinkSync(finalFile);
    });
  });
});

module.exports = router;
