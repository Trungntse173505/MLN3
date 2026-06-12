import React from "react";

export interface LeaderboardEntry {
  name: string;
  elapsedTime: number; // in seconds
  isResurrected: boolean;
}

interface ResurrectionLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function ResurrectionLeaderboard({ entries }: ResurrectionLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 font-mono text-sm">
        Không có người chơi bị loại nào trả lời đúng.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <div className="text-xs uppercase tracking-widest text-[#f59e0b] font-semibold text-center mb-4">
        Bảng vàng tốc độ (Top 5 người bị loại trả lời đúng)
      </div>
      
      <div className="space-y-2">
        {entries.map((entry, idx) => {
          const rank = idx + 1;
          return (
            <div
              key={entry.name}
              className={`flex items-center justify-between px-5 py-3.5 rounded-xl border transition-spring ${
                entry.isResurrected
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 glow-green scale-[1.01]"
                  : "bg-white/[0.02] border-white/5 text-zinc-400 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-bold ${
                    entry.isResurrected
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  #{rank}
                </span>
                <span className="font-semibold tracking-wide text-sm md:text-base">
                  {entry.name}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs px-2 py-1 rounded bg-black/30 border border-white/5">
                  {entry.elapsedTime.toFixed(2)}s
                </span>
                {entry.isResurrected ? (
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 tracking-wider">
                    HỒI SINH
                  </span>
                ) : (
                  <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded-full text-zinc-600">
                    BỊ LOẠI
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
