import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

const cleanUrl = (url) => url.split("&")[0];

export default function App() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submitVideo = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setSummary("");
    setStatus("Generating summary… ⏳");

    try {
      const res = await axios.post(`${API_BASE}/api/video/summary`, {
        url: cleanUrl(url),
      });

      setSummary(res.data.summary);
      setStatus("Summary ready ✅");
    } catch (err) {
      console.error(err);
      setStatus("Submission failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ===== CLIENT-SIDE DOWNLOADS ===== */
  const downloadTxt = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  const downloadAudio = () => {
    window.open(
      `https://yt1s.com/en?q=${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  const downloadVideo = () => {
    window.open(
      `https://y2mate.nu/en/search/${encodeURIComponent(cleanUrl(url))}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-10">

        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold">🎬 AI Video Summarizer</h1>
          <p className="text-slate-400 text-sm">
            Paste YouTube link • Get AI summary • Download client-side
          </p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700"
          />

          <button
            onClick={submitVideo}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {loading ? "Analyzing…" : "✨ Generate Summary"}
          </button>

          {status && <p className="text-center text-blue-300">{status}</p>}
        </div>

        {summary && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">📄 Video Summary</h2>

            <div className="bg-black/40 border border-slate-700 rounded-2xl p-6">
              <pre className="whitespace-pre-wrap text-slate-200">
                {summary}
              </pre>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={downloadTxt}
                className="px-5 py-2 bg-emerald-600 rounded-xl"
              >
                📄 Summary (.txt)
              </button>

              <button
                onClick={downloadAudio}
                className="px-5 py-2 bg-indigo-600 rounded-xl"
              >
                🔊 Audio
              </button>

              <button
                onClick={downloadVideo}
                className="px-5 py-2 bg-rose-600 rounded-xl"
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
