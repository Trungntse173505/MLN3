import React from "react";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger";
  icon?: React.ReactNode;
}

export function PillButton({
  children,
  variant = "primary",
  icon,
  className = "",
  ...props
}: PillButtonProps) {
  const baseStyle =
    "group relative inline-flex items-center justify-between rounded-full px-6 py-3 font-semibold text-sm transition-spring active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[#f59e0b] text-black shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02]",
    secondary:
      "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:scale-[1.02]",
    success:
      "bg-[#10b981] text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02]",
    danger:
      "bg-[#ef4444] text-white shadow-lg shadow-red-500/10 hover:shadow-red-500/20 hover:scale-[1.02]",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="flex-1 text-center pr-2">{children}</span>
      {icon && (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 transition-spring group-hover:translate-x-1 group-hover:scale-105">
          {icon}
        </span>
      )}
    </button>
  );
}
