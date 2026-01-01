import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";

export default function VideoView({ jobId }) {
  const [data, setData] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchResult = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/video/result/${jobId}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load result", err);
      }
    };

    fetchResult();
  }, [jobId]);

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin" />
        <p className="text-sm tracking-wide">
          Loading video & scene summary…
        </p>
      </div>
    );

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">

      {/* LEFT: VIDEO + TIMELINE */}
      <div className="lg:col-span-2 space-y-8">

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            🎥 Video Preview
          </h2>
          <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            Interactive Timeline
          </span>
        </div>

        <div className="rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
          <ReactPlayer
            ref={playerRef}
            url={data.url}
            controls
            width="100%"
            height="420px"
          />
        </div>

        {/* TIMELINE */}
        {Array.isArray(data.scenes) && data.scenes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Scene Timeline
            </h4>

            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {data.scenes.map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    playerRef.current?.seekTo(s.start, "seconds")
                  }
                  className="min-w-[190px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 hover:border-red-500/50 hover:scale-[1.02] transition-all"
                >
                  <div className="p-5 text-left space-y-2">
                    <div className="text-sm font-semibold text-red-400">
                      {s.start}s – {s.end}s
                    </div>
                    <div className="text-xs text-slate-400">
                      Click to jump to this scene
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: SCENE SUMMARY */}
      <aside className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 max-h-[540px] overflow-y-auto shadow-xl">

        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          🧩 Scene Breakdown
        </h3>

        {Array.isArray(data.scenes) && data.scenes.length > 0 ? (
          <div className="space-y-4">
            {data.scenes.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-black/40 border border-slate-700 p-5 hover:border-red-500/40 transition"
              >
                <div className="text-red-400 font-semibold mb-3">
                  {s.summary?.tldr || "Scene Summary"}
                </div>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1.5">
                  {s.summary?.bullets?.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">
            No scene breakdown available.
          </p>
        )}
      </aside>
    </section>
  );
}
