"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GlassCard } from "../../components/ui/GlassCard";
import { PillButton } from "../../components/ui/PillButton";
import { LockKey, ArrowRight, Warning } from "@phosphor-icons/react";
import { verifyPassword } from "./actions";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const nextPath = searchParams.get("next") || "/";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password.trim()) return;

    startTransition(async () => {
      const res = await verifyPassword(password);
      if (res.success) {
        router.push(nextPath);
      } else {
        setError(res.error || "Có lỗi xảy ra");
      }
    });
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505] overflow-hidden relative">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[150px] pointer-events-none" />

      <GlassCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 glow-gold">
            <LockKey size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2 animate-fade-in-up">
            Yêu Cầu Xác Thực
          </h1>
          <p className="text-zinc-400 text-sm">
            Vui lòng nhập mật khẩu để tiếp tục truy cập trang này.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pass" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Mật khẩu phòng game
            </label>
            <input
              id="pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-spring"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-mono">
              <Warning size={14} />
              <span>{error}</span>
            </div>
          )}

          <PillButton 
            type="submit" 
            variant="primary" 
            disabled={isPending}
            icon={<ArrowRight size={14} />} 
            className="w-full justify-center"
          >
            {isPending ? "Đang xác thực..." : "Tiếp Tục"}
          </PillButton>
        </form>
      </GlassCard>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505]">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">Đang tải trang xác thực...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
