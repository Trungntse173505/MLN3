import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className = "",
  onClick,
  hoverable = false,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bezel-outer transition-spring ${
        onClick ? "cursor-pointer" : ""
      } ${
        hoverable ? "hover:scale-[1.01] hover:border-white/10" : ""
      } ${className}`}
    >
      <div className="bezel-inner p-6 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
