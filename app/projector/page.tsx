"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { GameState, Player } from "../../lib/types";
import { questions } from "../../lib/questions";
import { GlassCard } from "../../components/ui/GlassCard";
import { ResurrectionLeaderboard, LeaderboardEntry } from "../../components/ui/ResurrectionLeaderboard";
import { Trophy, Users, ShieldCheck, Heartbeat, ShieldWarning } from "@phosphor-icons/react";

export default function ProjectorPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});

  // Subscribe to GameState
  useEffect(() => {
    const stateRef = ref(db, "gameState");
    return onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });
  }, []);

  // Subscribe to Players
  useEffect(() => {
    const playersRef = ref(db, "players");
    return onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(snapshot.val());
      } else {
        setPlayers({});
      }
    });
  }, []);

  if (!gameState) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505] text-zinc-500 font-mono text-sm animate-pulse">
        Đang tải màn hình máy chiếu...
      </main>
    );
  }

  const playerList = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
  const alivePlayers = playerList.filter((p) => p.status === "alive");
  const deadPlayers = playerList.filter((p) => p.status === "dead");
  const winnerPlayers = playerList.filter((p) => p.status === "winner");
  const totalCount = playerList.length;

  const currentQ = questions.find(q => q.id === gameState.activeQuestionId) || questions[gameState.currentQuestion - 1];
  const correctAnswer = currentQ?.answer;

  // Count how many of the active answering players have submitted answers
  // Answering players are:
  // - If survival mode: only alive players
  // - If normal mode: both alive and dead players (since dead can answer for resurrection)
  const answeringPlayers = gameState.mode === "survival"
    ? alivePlayers
    : playerList.filter(p => p.status === "alive" || p.status === "dead");

  const submittedCount = answeringPlayers.filter((p) => p.answer !== null && p.answer !== undefined).length;
  const targetAnswerCount = answeringPlayers.length;

  // Calculate top 5 dead players who answered correctly for the current question
  let leaderboardEntries: LeaderboardEntry[] = [];
  if (gameState.phase === "reveal" && currentQ) {
    const resurrectedNames = gameState.resurrectedThisRound || [];
    const correctDeadPlayers = playerList
      .filter((p) => {
        const wasDead = p.status === "dead" || resurrectedNames.includes(p.name);
        const answeredCorrectly = p.answer === currentQ.answer;
        return wasDead && answeredCorrectly && p.answerTime != null && gameState.questionStartTime != null;
      })
      .map((p) => {
        const timeDiff = ((p.answerTime || 0) - (gameState.questionStartTime || 0)) / 1000;
        const isResurrected = resurrectedNames.includes(p.name);
        return {
          name: p.name,
          elapsedTime: Math.max(0, timeDiff),
          isResurrected
        };
      })
      .sort((a, b) => a.elapsedTime - b.elapsedTime)
      .slice(0, 5);

    leaderboardEntries = correctDeadPlayers;
  }

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between bg-[#050505] text-white p-8 md:p-12 relative overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Top Banner */}
      <header className="flex justify-between items-center border-b border-white/5 pb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse glow-gold" />
          <span className="font-mono text-sm uppercase tracking-[0.25em] text-[#f59e0b] font-bold">
            HCM202 — ĐÚNG HAY SAI
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-zinc-500" />
            <span>Sĩ số: <strong className="text-white font-bold">{totalCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">🧍 Sống: {alivePlayers.length}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-red-400 font-semibold">💀 Loại: {deadPlayers.length}</span>
            {winnerPlayers.length > 0 && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-amber-400 font-semibold">🏆 Thắng: {winnerPlayers.length}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Center Screen Area */}
      <div className="flex-1 flex flex-col justify-center py-12 z-10 max-w-5xl mx-auto w-full">

        {/* Phase 1: LOBBY */}
        {gameState.phase === "lobby" && (
          <div className="text-center space-y-12 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-none">
                ĐÚNG HAY SAI?
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto pt-2">
                Trò chơi trắc nghiệm tương tác thực tế kết hợp cơ chế hồi sinh siêu tốc
              </p>
            </div>

            {/* Direct Join Link */}
            <div className="inline-block px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/5 glow-gold max-w-md mx-auto">
              <div className="text-xs uppercase font-mono tracking-widest text-[#f59e0b] mb-1.5 font-bold">
                Tham gia ngay bằng điện thoại
              </div>
              <div className="text-xl md:text-2xl font-mono font-bold tracking-wide text-white">
                Vào đường dẫn: <span className="text-[#f59e0b]">/play</span>
              </div>
            </div>

            {/* Live Names List */}
            <div className="space-y-4 pt-6">
              <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Danh sách người chơi trong phòng ({totalCount})
              </div>

              {playerList.length === 0 ? (
                <p className="text-sm text-zinc-600 font-mono italic">Đang chờ người chơi đầu tiên...</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto max-h-[200px] overflow-y-auto pr-1">
                  {playerList.map((p) => (
                    <span
                      key={p.name}
                      className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-zinc-300 font-medium text-sm md:text-base transition-spring animate-fade-in-up shadow-sm hover:border-[#f59e0b]/30"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: QUESTION & Phase 3: REVEAL */}
        {(gameState.phase === "question" || gameState.phase === "reveal") && currentQ && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                  Câu hỏi {gameState.currentQuestion} / {questions.length}
                </span>
                {gameState.mode === "survival" ? (
                  <span className="text-xs font-mono font-bold text-red-500 border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                    🔥 VÒNG SINH TỒN — TÌM ĐỦ 3 NGƯỜI THẮNG
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded-full tracking-wider">
                    🟢 VÒNG THƯỜNG (HỒI SINH MỞ)
                  </span>
                )}
              </div>

              {/* Submission status bar */}
              {gameState.phase === "question" && targetAnswerCount > 0 && (
                <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 rounded-full px-3 py-1 text-xs font-mono text-zinc-400">
                  <ShieldCheck size={14} className="text-[#f59e0b]" />
                  <span>
                    Đã nhận bài: <strong className="text-white font-bold">{submittedCount} / {targetAnswerCount}</strong>
                  </span>
                </div>
              )}
            </div>

            {gameState.mode === "survival" && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-2xl mx-auto w-full text-center space-y-2 animate-fade-in">
                <h2 className="text-sm font-mono font-bold text-red-400 uppercase tracking-[0.2em]">Vòng Tranh Suất Top 3</h2>
                <div className="grid grid-cols-3 gap-4 text-xs font-mono text-zinc-300">
                  <div>Đã có: <strong className="text-white text-sm">{3 - (gameState.winnerSlotsRemaining ?? 3)} winner</strong></div>
                  <div>Còn thiếu: <strong className="text-white text-sm">{gameState.winnerSlotsRemaining ?? 3} slot</strong></div>
                  <div>Số người đang tranh: <strong className="text-white text-sm">{gameState.survivalContestants?.length || 0}</strong></div>
                </div>
              </div>
            )}

            <div className="bezel-outer">
              <div className="bezel-inner p-8 md:p-12 text-center">
                <p className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-snug md:leading-normal text-white max-w-4xl mx-auto">
                  {currentQ.statement}
                </p>
              </div>
            </div>

            {/* Answer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* ĐÚNG Card */}
              <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-700 ease-in-out ${
                gameState.phase === "reveal"
                  ? currentQ.answer
                    ? "bg-emerald-500/20 border-emerald-500/40 glow-green scale-105"
                    : "opacity-0 scale-95 pointer-events-none"
                  : "bg-emerald-500/5 border-emerald-500/10 glow-green"
              }`}>
                <div>
                  <h3 className="text-2xl font-black text-emerald-300">ĐÚNG</h3>
                </div>
                <span className="text-4xl">🟢</span>
              </div>

              {/* SAI Card */}
              <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-700 ease-in-out ${
                gameState.phase === "reveal"
                  ? !currentQ.answer
                    ? "bg-red-500/20 border-red-500/40 glow-red scale-105"
                    : "opacity-0 scale-95 pointer-events-none"
                  : "bg-red-500/5 border-red-500/10 glow-red"
              }`}>
                <div>
                  <h3 className="text-2xl font-black text-red-300">SAI</h3>
                </div>
                <span className="text-4xl">🔴</span>
              </div>
            </div>

            {/* Explanation & Resurrection Leaderboard (only show in reveal phase) */}
            {gameState.phase === "reveal" && (
              <div className="space-y-6 pt-4 animate-fade-in">
                {currentQ.explanation && (
                  <div className="max-w-3xl mx-auto text-center px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-sm leading-relaxed text-zinc-400">{currentQ.explanation}</p>
                  </div>
                )}

                {gameState.mode === "normal" ? (
                  <>
                    {/* Hồi sinh và loại ở Vòng Thường */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                      {/* Bị loại */}
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
                        <div className="text-xs uppercase font-mono font-bold text-red-400">💀 Bị Loại Vòng Này ({gameState.eliminatedThisRound?.length || 0})</div>
                        {gameState.eliminatedThisRound && gameState.eliminatedThisRound.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {gameState.eliminatedThisRound.map(name => (
                              <span key={name} className="px-2.5 py-1 text-xs rounded bg-red-500/10 border border-red-500/20 text-red-300 font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 font-mono italic">Không có ai bị loại.</p>
                        )}
                      </div>

                      {/* Hồi sinh */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                        <div className="text-xs uppercase font-mono font-bold text-emerald-400">🎉 Hồi Sinh Vòng Này ({gameState.resurrectedThisRound?.length || 0})</div>
                        {gameState.resurrectedThisRound && gameState.resurrectedThisRound.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {gameState.resurrectedThisRound.map(name => (
                              <span key={name} className="px-2.5 py-1 text-xs rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 font-mono italic">Không có ai được hồi sinh.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <ResurrectionLeaderboard entries={leaderboardEntries} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Chi tiết Vòng Sinh Tồn */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                      {/* Hồi sinh vòng này (collapse) */}
                      {gameState.resurrectedThisRound && gameState.resurrectedThisRound.length > 0 && (
                        <div className="col-span-full p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 animate-fade-in">
                          <div className="text-xs uppercase font-mono font-bold text-emerald-400">🎉 Hồi Sinh Vòng Này ({gameState.resurrectedThisRound.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {gameState.resurrectedThisRound.map(name => (
                              <span key={name} className="px-2.5 py-1 text-xs rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">Những người này đã được hồi sinh và sẽ tham gia tranh suất Top 3 ở câu sau.</p>
                        </div>
                      )}

                      {/* Trả lời đúng */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                        <div className="text-xs uppercase font-mono font-bold text-emerald-400">🟢 Trả lời đúng</div>
                        <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                          {playerList
                            .filter(p => gameState.survivalContestants?.includes(p.name) && p.answer === correctAnswer)
                            .map(p => (
                              <div key={p.name} className="flex justify-between items-center text-xs font-mono text-zinc-300">
                                <span>{p.name}</span>
                                <span className="text-zinc-500">
                                  {p.answerTime && gameState.questionStartTime 
                                    ? `${((p.answerTime - gameState.questionStartTime) / 1000).toFixed(2)}s` 
                                    : ""}
                                </span>
                              </div>
                            ))}
                          {playerList.filter(p => gameState.survivalContestants?.includes(p.name) && p.answer === correctAnswer).length === 0 && (
                            <p className="text-xs text-zinc-600 italic">Không có ai đúng</p>
                          )}
                        </div>
                      </div>

                      {/* Trả lời sai / Không trả lời */}
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
                        <div className="text-xs uppercase font-mono font-bold text-red-400">🔴 Trả lời sai / Không trả lời</div>
                        <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 text-xs font-mono text-zinc-300">
                          {playerList
                            .filter(p => gameState.survivalContestants?.includes(p.name) && p.answer !== correctAnswer)
                            .map(p => (
                              <div key={p.name}>
                                {p.name} <span className="text-zinc-600">({p.answer === null ? "Không trả lời" : "Sai"})</span>
                              </div>
                            ))}
                          {playerList.filter(p => gameState.survivalContestants?.includes(p.name) && p.answer !== correctAnswer).length === 0 && (
                            <p className="text-xs text-zinc-600 italic">Không có ai sai</p>
                          )}
                        </div>
                      </div>

                      {/* Suất thắng vòng này */}
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                        <div className="text-xs uppercase font-mono font-bold text-amber-400">🏆 Suất thắng vòng này</div>
                        <div className="space-y-2">
                          {gameState.winnersThisRound && gameState.winnersThisRound.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {gameState.winnersThisRound.map(name => (
                                <span key={name} className="px-2.5 py-0.5 text-xs rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-500 italic">Chưa xác định thêm người thắng.</p>
                              {playerList.filter(p => gameState.survivalContestants?.includes(p.name) && p.answer === correctAnswer).length === 0 && (
                                <p className="text-[11px] text-[#f59e0b] font-medium leading-relaxed font-mono">
                                  ⚠️ Chưa có người giành được suất.<br />
                                  Nhóm hiện tại sẽ tiếp tục với câu hỏi tiếp theo.
                                </p>
                              )}
                            </div>
                          )}
                          <div className="text-[11px] font-mono text-zinc-400 border-t border-white/5 pt-2">
                            Số slot thắng còn lại: <strong className="text-white font-bold">{gameState.winnerSlotsRemaining ?? 3}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase 4: FINISHED */}
        {gameState.phase === "finished" && (
          <div className="text-center space-y-12 animate-fade-in-up">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2 glow-gold">
                <Trophy size={44} weight="fill" />
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white leading-none">
                TRÒ CHƠI KẾT THÚC
              </h1>
              <p className="text-zinc-400 text-base max-w-xl mx-auto">
                Chúc mừng tất cả các bạn đã hoàn thành xuất sắc thử thách tìm hiểu về chủ nghĩa yêu nước Việt Nam!
              </p>
            </div>

            {/* Survived players announcement */}
            <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-[#f59e0b] font-bold">
                👑 TOP 3 CHIẾN THẮNG CHUNG CUỘC
              </h3>

              {winnerPlayers.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">Không có ai đạt đủ điều kiện thắng.</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {winnerPlayers.map((p) => (
                    <span
                      key={p.name}
                      className="px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-base glow-gold animate-bounce shadow-lg shadow-amber-500/10"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status bar */}
      <footer className="flex justify-between items-center text-[10px] font-mono text-zinc-600 border-t border-white/5 pt-6 z-10">
        <span>© {new Date().getFullYear()} HCM202 QUIZ GAME</span>
        <span>MÀN HÌNH MÁY CHIẾU LỚP HỌC</span>
      </footer>
    </main>
  );
}
