import React from "react";

interface StatusBadgeProps {
  status: "alive" | "dead" | "resurrected" | "winner";
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const configs = {
    alive: {
      text: "CÒN SỐNG",
      style: "border-emerald-500/30 text-[#10b981] bg-emerald-500/10 glow-green",
      icon: "🟢",
    },
    dead: {
      text: "BỊ LOẠI",
      style: "border-red-500/30 text-[#ef4444] bg-red-500/10 glow-red",
      icon: "💀",
    },
    resurrected: {
      text: "ĐÃ HỒI SINH",
      style: "border-amber-500/30 text-[#f59e0b] bg-amber-500/10 glow-gold",
      icon: "🎉",
    },
    winner: {
      text: "CHIẾN THẮNG",
      style: "border-amber-500/30 text-[#f59e0b] bg-amber-500/10 glow-gold",
      icon: "👑",
    },
  };

  const current = configs[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border tracking-wider ${current.style} ${className}`}
    >
      <span className="text-[10px]">{current.icon}</span>
      <span>{current.text}</span>
    </div>
  );
}
