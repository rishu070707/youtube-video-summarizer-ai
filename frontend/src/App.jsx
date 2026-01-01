import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// 🔥 CLEAN YT URL
const cleanUrl = (url) => url.split("&")[0];

export default function App() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null); // ⬅️ IMPORTANT
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
    setResult(null);
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

            // ✅ SAFE RESULT SET
            setResult(
              r.data.data ||
              r.data.summary ||
              "Summary generated successfully."
            );

            setStatus("Summary ready ✅");
            setLoading(false);
          }
        } catch (err) {
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

  /* ================= DOWNLOADS ================= */
  const downloadTxt = () => {
    const blob = new Blob(
      [result || "Summary generated successfully."],
      { type: "text/plain" }
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-10">

        {/* HEADER */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            🎬 AI Video Summarizer
          </h1>
          <p className="text-slate-400 text-sm">
            Paste a YouTube link • Get AI summary • Download client-side
          </p>
        </header>

        {/* CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">

          {/* INPUT */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">
              YouTube Video URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={submitVideo}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold tracking-wide transition-all ${
              loading
                ? "bg-slate-700 cursor-not-allowed animate-pulse"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
            }`}
          >
            {loading ? "Analyzing video…" : "✨ Generate Summary"}
          </button>

          {/* STATUS */}
          {status && (
            <div className="text-center space-y-1">
              {jobId && (
                <p className="text-xs text-emerald-400 font-mono">
                  Job ID: {jobId}
                </p>
              )}
              <p className="text-blue-300">{status}</p>
            </div>
          )}
        </div>

        {/* RESULT + DOWNLOAD */}
        {(result || jobId) && (
          <section className="space-y-6">

            <h2 className="text-2xl font-bold text-center">
              📄 Video Summary
            </h2>

            <div className="bg-black/40 border border-slate-700 rounded-2xl p-6 shadow-inner">
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                {result || "Summary generated successfully."}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={downloadTxt}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition font-medium"
              >
                📄 Download Summary
              </button>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-slate-500 pt-6">
          2026 · AI Video Summarizer
        </footer>
      </div>
    </div>
  );
}
