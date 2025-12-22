import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const submitVideo = async () => {
    if (!url.trim()) return;

    setResult(null);
    setJobId(null);
    setStatus("Submitting video...");

    try {
      const res = await axios.post(
        "http://localhost:4000/api/video/submit",
        { url }
      );

      const id = res.data.jobId;
      setJobId(id);
      setStatus("Processing video... Please wait.");

      pollingRef.current = setInterval(async () => {
        try {
          const r = await axios.get(
            `http://localhost:4000/api/video/result/${id}`
          );

          if (r.data.ready) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;

            setResult(r.data.data);
            setStatus("Summary ready");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setStatus("Submission failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-center items-start p-10">
      <div className="w-full max-w-3xl">
        {/* INPUT CARD */}
        <div className="bg-slate-900/80 p-6 rounded-xl shadow-lg">
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            YouTube Video URL
          </label>

          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={submitVideo}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
          >
            Submit Video
          </button>
        </div>

        {/* STATUS */}
        {jobId && (
          <div className="mt-6 text-center">
            <p className="text-green-400 font-mono">
              Job ID: {jobId}
            </p>
            <p className="mt-2 text-blue-300">{status}</p>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-bold">Video Summary</h2>

            {result.scenes.map((scene, idx) => (
              <div
                key={scene.id || idx}
                className="bg-slate-900/70 p-5 rounded-xl border border-slate-700"
              >
                <p className="text-sm text-slate-400 mb-1">
                  Scene {idx + 1} ({scene.start}s – {scene.end}s)
                </p>

                <p className="text-slate-200 leading-relaxed">
                  {scene.summary || "No summary available"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
