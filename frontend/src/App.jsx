import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// clean YouTube URL
const cleanUrl = (url) => url.split("&")[0];

export default function App() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => pollingRef.current && clearInterval(pollingRef.current);
  }, []);

  /* ================= SUBMIT ================= */
  const submitVideo = async () => {
    if (!url.trim() || loading) return;

    const finalUrl = cleanUrl(url);

    setLoading(true);
    setSummary("");
    setJobId(null);
    setStatus("Submitting video…");

    try {
      const res = await axios.post(`${API_BASE}/api/video/submit`, {
        url: finalUrl,
      });

      const id = res.data.jobId;
      setJobId(id);
      setStatus("Processing video… ⏳");

      pollingRef.current = setInterval(async () => {
        try {
          const r = await axios.get(
            `${API_BASE}/api/video/result/${id}`
          );

          if (r.data.ready) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setSummary(r.data.data);
            setStatus("Summary ready ✅");
            setLoading(false);
          }
        } catch {
          clearInterval(pollingRef.current);
          setStatus("Server error ❌");
          setLoading(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("Submission failed ❌");
      setLoading(false);
    }
  };

  /* ================= DOWNLOAD SUMMARY ================= */
  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  /* ================= CLIENT-SIDE DOWNLOAD REDIRECTS ================= */
  const downloadVideo = () => {
    window.open(
      `https://ytdlp.nu/?url=${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  const downloadAudio = () => {
    window.open(
      `https://yt1s.com/en?q=${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-10">

        {/* HEADER */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold">🎬 AI Video Summarizer</h1>
          <p className="text-slate-400 text-sm">
            Paste a YouTube link • Get AI summary • Download client-side
          </p>
        </header>

        {/* INPUT CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700 focus:border-blue-500 outline-none"
          />

          <button
            onClick={submitVideo}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold ${
              loading
                ? "bg-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
            }`}
          >
            {loading ? "Analyzing…" : "✨ Generate Summary"}
          </button>

          {status && (
            <p className="text-center text-blue-300 text-sm">{status}</p>
          )}
        </div>

        {/* SUMMARY */}
        {summary && (
          <section className="space-y-6">

            <h2 className="text-2xl font-bold text-center">📄 Video Summary</h2>

            <div className="bg-black/40 border border-slate-700 rounded-2xl p-6 whitespace-pre-line">
              {summary}
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-wrap justify-center gap-4">

              <button
                onClick={downloadSummary}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                📄 Download Summary
              </button>

              <button
                onClick={downloadVideo}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700"
              >
                🎥 Download Video
              </button>

              <button
                onClick={downloadAudio}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                🔊 Download Audio
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
