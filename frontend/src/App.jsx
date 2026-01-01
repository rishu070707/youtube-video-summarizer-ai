import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// clean youtube url
const cleanUrl = (url) => url.split("&")[0];

export default function App() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => pollRef.current && clearInterval(pollRef.current);
  }, []);

  /* ================= SUBMIT ================= */
  const submitVideo = async () => {
    if (!url.trim() || loading) return;

    setLoading(true);
    setSummary("");
    setJobId(null);
    setStatus("Submitting video…");

    try {
      const res = await axios.post(`${API_BASE}/api/video/submit`, {
        url: cleanUrl(url),
      });

      const id = res.data.jobId;
      setJobId(id);
      setStatus("Processing video… ⏳");

      pollRef.current = setInterval(async () => {
        const r = await axios.get(
          `${API_BASE}/api/video/result/${id}`
        );

        if (r.data.ready) {
          clearInterval(pollRef.current);
          setSummary(r.data.data);
          setStatus("Summary ready ✅");
          setLoading(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("Submission failed ❌");
      setLoading(false);
    }
  };

  /* ================= DOWNLOADS ================= */

  // summary txt
  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "summary.txt";
    a.click();
  };

  // video download (client-side redirect)
  const downloadVideo = () => {
    window.open(
      `https://yt1s.com/en?q=${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  // audio download (client-side redirect)
  const downloadAudio = () => {
    window.open(
      `https://y2mate.is/en?q=${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-10">

        {/* HEADER */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold">
            🎬 AI Video Summarizer
          </h1>
          <p className="text-slate-400 text-sm">
            Paste a YouTube link • Get AI summary • Download client-side
          </p>
        </header>

        {/* INPUT CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700"
          />

          <button
            onClick={submitVideo}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold ${
              loading
                ? "bg-slate-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
          >
            {loading ? "Analyzing…" : "✨ Generate Summary"}
          </button>

          {status && (
            <p className="text-center text-blue-300">{status}</p>
          )}
        </div>

        {/* SUMMARY */}
        {summary && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">
              📄 Video Summary
            </h2>

            <div className="bg-black/40 border border-slate-700 rounded-xl p-6 whitespace-pre-line">
              {summary}
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={downloadSummary}
                className="px-5 py-2 rounded-xl bg-emerald-600"
              >
                📄 Summary (.txt)
              </button>

              <button
                onClick={downloadAudio}
                className="px-5 py-2 rounded-xl bg-indigo-600"
              >
                🔊 Audio
              </button>

              <button
                onClick={downloadVideo}
                className="px-5 py-2 rounded-xl bg-rose-600"
              >
                🎥 Video
              </button>
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-slate-500">
          2026 • AI Video Summarizer
        </footer>
      </div>
    </div>
  );
}
