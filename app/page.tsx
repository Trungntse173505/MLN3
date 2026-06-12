"use client";

import Link from "next/link";
import { GlassCard } from "../components/ui/GlassCard";
import { DeviceMobile, Monitor, Sliders, Trophy } from "@phosphor-icons/react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[800px] h-[800px] rounded-full bg-amber-500/[0.03] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[800px] h-[800px] rounded-full bg-emerald-500/[0.03] blur-[150px] pointer-events-none" />

      {/* Header section */}
      <main className="w-full max-w-4xl flex flex-col items-center justify-center gap-12 z-10">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#f59e0b] mb-2 glow-gold">
            <Trophy size={22} weight="fill" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
            ĐÚNG HAY SAI?
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-[50ch] mx-auto leading-relaxed">
            Hệ thống trò chơi trắc nghiệm real-time môn học HCM202, kết hợp tương tác thực tế và cơ chế hồi sinh tự động.
          </p>
        </div>

        {/* Portal selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fade-in-up">
          <Link href="/play" className="group block">
            <GlassCard hoverable className="h-full border border-white/5 group-hover:border-amber-500/30">
              <div className="flex flex-col h-full justify-between items-center text-center space-y-6 py-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/10 text-[#f59e0b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#f59e0b]/10 transition-spring">
                  <DeviceMobile size={22} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">📱 Màn Hình Điện Thoại</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed px-2">
                    Dành cho người tham gia chơi. Nhập tên và trả lời câu hỏi trực tiếp trên di động.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#f59e0b] group-hover:underline">
                  VÀO CHƠI &rarr;
                </span>
              </div>
            </GlassCard>
          </Link>

          <Link href="/projector" className="group block">
            <GlassCard hoverable className="h-full border border-white/5 group-hover:border-amber-500/30">
              <div className="flex flex-col h-full justify-between items-center text-center space-y-6 py-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/10 text-[#f59e0b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#f59e0b]/10 transition-spring">
                  <Monitor size={22} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">🖥️ Màn Hình Máy Chiếu</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed px-2">
                    Hiển thị câu hỏi, đếm ngược, kết quả đáp án và bảng vàng hồi sinh cho cả lớp xem.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#f59e0b] group-hover:underline">
                  TRÌNH CHIẾU &rarr;
                </span>
              </div>
            </GlassCard>
          </Link>

          <Link href="/admin" className="group block">
            <GlassCard hoverable className="h-full border border-white/5 group-hover:border-amber-500/30">
              <div className="flex flex-col h-full justify-between items-center text-center space-y-6 py-6">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/10 text-[#f59e0b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#f59e0b]/10 transition-spring">
                  <Sliders size={22} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">⚙️ Bảng Điều Khiển Admin</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed px-2">
                    Dành cho Ban tổ chức điều phối câu hỏi, duyệt trạng thái sống/chết và tùy chỉnh hồi sinh.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#f59e0b] group-hover:underline">
                  QUẢN LÝ &rarr;
                </span>
              </div>
            </GlassCard>
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[10px] font-mono text-zinc-700">
        <span>© {new Date().getFullYear()} HCM202</span>
        <span>DESIGNED BY ANTIGRAVITY</span>
      </footer>
    </div>
  );
}
