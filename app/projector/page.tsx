"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { GameState, Player } from "../../lib/types";
import { questions } from "../../lib/questions";
import { GlassCard } from "../../components/ui/GlassCard";
import { ResurrectionLeaderboard, LeaderboardEntry } from "../../components/ui/ResurrectionLeaderboard";
import { Trophy, Users, ShieldCheck, Heartbeat, ShieldWarning } from "@phosphor-icons/react";

// Helper function to sort players based on correctness and speed
const sortPlayersForRound = (list: Player[], correctAnswer: boolean) => {
  const correct = list.filter(p => p.answer === correctAnswer && p.answerTime != null);
  const wrong = list.filter(p => p.answer !== correctAnswer && p.answer !== null && p.answer !== undefined);
  const noAnswer = list.filter(p => p.answer === null || p.answer === undefined);

  // Sort correct by answerTime asc
  correct.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));

  return [...correct, ...wrong, ...noAnswer];
};

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
    const resurrectedNames = gameState.resultsApplied
      ? (gameState.resurrectedThisRound || [])
      : (gameState.pendingResurrections || []);
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

            {/* Question statement: Only show in question phase */}
            {gameState.phase === "question" && (
              <div className="bezel-outer">
                <div className="bezel-inner p-8 md:p-12 text-center">
                  <p className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-snug md:leading-normal text-white max-w-4xl mx-auto">
                    {currentQ.statement}
                  </p>
                </div>
              </div>
            )}

            {/* Answer Cards */}
            {gameState.phase === "question" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* ĐÚNG Card */}
                <div className="flex items-center justify-between p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 glow-green">
                  <div>
                    <h3 className="text-2xl font-black text-emerald-300">ĐÚNG</h3>
                  </div>
                  <span className="text-4xl">🟢</span>
                </div>

                {/* SAI Card */}
                <div className="flex items-center justify-between p-6 rounded-2xl border border-red-500/10 bg-red-500/5 glow-red">
                  <div>
                    <h3 className="text-2xl font-black text-red-300">SAI</h3>
                  </div>
                  <span className="text-4xl">🔴</span>
                </div>
              </div>
            ) : (
              /* Phase: REVEAL - Center correct answer card */
              <div className="flex justify-center pt-4">
                {currentQ.answer ? (
                  <div className="flex items-center justify-between gap-12 px-12 py-8 rounded-3xl border bg-emerald-500/20 border-emerald-500/40 glow-green max-w-md w-full shadow-2xl shadow-emerald-500/10 scale-105 transition-all duration-700">
                    <div>
                      <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest block mb-1">
                        Đáp án đúng
                      </span>
                      <h3 className="text-4xl font-black text-emerald-300">ĐÚNG</h3>
                    </div>
                    <span className="text-6xl animate-pulse">🟢</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-12 px-12 py-8 rounded-3xl border bg-red-500/20 border-red-500/40 glow-red max-w-md w-full shadow-2xl shadow-red-500/10 scale-105 transition-all duration-700">
                    <div>
                      <span className="font-mono text-xs text-red-400 uppercase tracking-widest block mb-1">
                        Đáp án đúng
                      </span>
                      <h3 className="text-4xl font-black text-red-300">SAI</h3>
                    </div>
                    <span className="text-6xl animate-pulse">🔴</span>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Round Evaluation Tables for Projector */}
            {gameState.phase === "reveal" && (
              <div className="space-y-6 pt-6 animate-fade-in max-w-5xl mx-auto w-full">
                {/* Status header banner */}
                <div className="text-center">
                  <span className={`inline-block px-6 py-2 rounded-full font-mono text-sm font-bold uppercase tracking-widest ${gameState.resultsApplied
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 glow-green"
                    : "bg-amber-500/10 border border-amber-500/30 text-[#f59e0b] animate-pulse glow-gold"
                    }`}>
                    {gameState.resultsApplied
                      ? "KẾT QUẢ CHÍNH THỨC"
                      : "KẾT QUẢ DỰ KIẾN — CHỜ ADMIN XÁC NHẬN"}
                  </span>
                </div>

                {/* Question 1: Unified Table */}
                {gameState.currentQuestion === 1 ? (
                  <GlassCard>
                    <div className="space-y-4">
                      <div className="text-sm uppercase font-mono font-bold text-zinc-400 tracking-wider text-center">
                        Bảng Xếp Hạng Vòng 1 (Toàn Bộ Người Chơi)
                      </div>
                      <div className="overflow-x-auto font-mono text-sm text-zinc-300">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-zinc-500 font-bold">
                              <th className="py-3 px-4">Hạng</th>
                              <th className="py-3 px-4">Tên</th>
                              <th className="py-3 px-4">Kết Quả</th>
                              <th className="py-3 px-4 text-right">Thời Gian</th>
                              <th className="py-3 px-4 text-right">Trạng Thái Sau Vòng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortPlayersForRound(playerList, correctAnswer).map((p, idx) => {
                              const isCorrect = p.answer === correctAnswer;
                              const answered = p.answer !== null && p.answer !== undefined;

                              let proposedStatus = "CÒN SỐNG";
                              if (!gameState.resultsApplied) {
                                if (gameState.pendingEliminations?.includes(p.name) || gameState.pendingAdditionalEliminations?.includes(p.name)) {
                                  proposedStatus = "DỰ KIẾN MỚI BỊ LOẠI";
                                }
                              } else {
                                proposedStatus = p.status === "dead"
                                  ? (p.lastAction === "eliminated" ? "MỚI BỊ LOẠI" : "BỊ LOẠI")
                                  : "CÒN SỐNG";
                              }

                              return (
                                <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                  <td className="py-3 px-4 font-bold text-white">
                                    {isCorrect ? `${idx + 1}` : "-"}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                                  <td className="py-3 px-4">
                                    {!answered ? (
                                      <span className="text-zinc-600">Không trả lời</span>
                                    ) : isCorrect ? (
                                      <span className="text-emerald-400 font-bold">ĐÚNG</span>
                                    ) : (
                                      <span className="text-red-400 font-bold">SAI</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-zinc-300">
                                    {p.answerTime && gameState.questionStartTime
                                      ? `${((p.answerTime - gameState.questionStartTime) / 1000).toFixed(2)}s`
                                      : "-"}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold">
                                    <span className={
                                      proposedStatus.includes("CÒN SỐNG") ? "text-emerald-400" : "text-red-400"
                                    }>
                                      {proposedStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </GlassCard>
                ) : (
                  /* Question 2+: Side-by-Side Tables */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* BẢNG NGƯỜI SỐNG */}
                    <GlassCard>
                      <div className="space-y-4">
                        <div className="text-sm uppercase font-mono font-bold text-emerald-400 tracking-wider text-center">
                          🧍 SỐ NGƯỜI SỐNG ({
                            playerList.filter(p => p.status === "alive" || p.status === "winner").length
                          })
                        </div>
                        <div className="overflow-x-auto font-mono text-xs text-zinc-300">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-zinc-500 font-bold">
                                <th className="py-2.5 px-3">Hạng</th>
                                <th className="py-2.5 px-3">Tên</th>
                                <th className="py-2.5 px-3">Kết Quả</th>
                                <th className="py-2.5 px-3 text-right">Thời Gian</th>
                                <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const alivePlayers = playerList.filter(p => p.status === "alive" || p.status === "winner");
                                return sortPlayersForRound(alivePlayers, correctAnswer).map((p, idx) => {
                                  const isCorrect = p.answer === correctAnswer;
                                  const answered = p.answer !== null && p.answer !== undefined;

                                  let statusText = "CÒN SỐNG";
                                  if (!gameState.resultsApplied) {
                                    if (gameState.pendingEliminations?.includes(p.name) || gameState.pendingAdditionalEliminations?.includes(p.name)) {
                                      statusText = "DỰ KIẾN MỚI BỊ LOẠI";
                                    }
                                  } else {
                                    if (p.lastAction === "resurrected") {
                                      statusText = "ĐÃ HỒI SINH";
                                    }
                                  }

                                  return (
                                    <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-3 font-bold text-white">
                                        {isCorrect ? `${idx + 1}` : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[100px]" title={p.name}>{p.name}</td>
                                      <td className="py-2.5 px-3">
                                        {!answered ? (
                                          <span className="text-zinc-600">N/A</span>
                                        ) : isCorrect ? (
                                          <span className="text-emerald-400 font-bold">ĐÚNG</span>
                                        ) : (
                                          <span className="text-red-400 font-bold">SAI</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold text-zinc-300">
                                        {p.answerTime && gameState.questionStartTime
                                          ? `${((p.answerTime - gameState.questionStartTime) / 1000).toFixed(2)}s`
                                          : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold">
                                        <span className={statusText.includes("BỊ LOẠI") ? "text-red-400" : statusText === "ĐÃ HỒI SINH" ? "text-amber-400 animate-pulse font-extrabold" : "text-emerald-400"}>
                                          {statusText}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </GlassCard>

                    {/* BẢNG NGƯỜI CHẾT */}
                    <GlassCard>
                      <div className="space-y-4">
                        <div className="text-sm uppercase font-mono font-bold text-red-400 tracking-wider text-center">
                          💀 SỐ NGƯỜI CHẾT ({
                            playerList.filter(p => p.status === "dead").length
                          })
                        </div>
                        <div className="overflow-x-auto font-mono text-xs text-zinc-300">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-zinc-500 font-bold">
                                <th className="py-2.5 px-3">Hạng</th>
                                <th className="py-2.5 px-3">Tên</th>
                                <th className="py-2.5 px-3">Kết Quả</th>
                                <th className="py-2.5 px-3 text-right">Thời Gian</th>
                                <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const deadPlayers = playerList.filter(p => p.status === "dead");
                                return sortPlayersForRound(deadPlayers, correctAnswer).map((p, idx) => {
                                  const isCorrect = p.answer === correctAnswer;
                                  const answered = p.answer !== null && p.answer !== undefined;

                                  let statusText = "BỊ LOẠI";
                                  if (!gameState.resultsApplied) {
                                    if (gameState.pendingResurrections?.includes(p.name)) {
                                      statusText = "DỰ KIẾN HỒI SINH";
                                    }
                                  } else {
                                    if (p.lastAction === "eliminated") {
                                      statusText = "MỚI BỊ LOẠI";
                                    }
                                  }

                                  return (
                                    <tr key={p.name} className="border-b border-white/5 hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-3 font-bold text-white">
                                        {isCorrect ? `${idx + 1}` : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[100px]" title={p.name}>{p.name}</td>
                                      <td className="py-2.5 px-3">
                                        {!answered ? (
                                          <span className="text-zinc-600">N/A</span>
                                        ) : isCorrect ? (
                                          <span className="text-emerald-400 font-bold">ĐÚNG</span>
                                        ) : (
                                          <span className="text-red-400 font-bold">SAI</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold text-zinc-300">
                                        {p.answerTime && gameState.questionStartTime
                                          ? `${((p.answerTime - gameState.questionStartTime) / 1000).toFixed(2)}s`
                                          : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold">
                                        <span className={statusText.includes("HỒI SINH") ? "text-amber-400 animate-pulse font-extrabold" : statusText === "MỚI BỊ LOẠI" ? "text-red-500 font-extrabold" : "text-zinc-500"}>
                                          {statusText}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </GlassCard>

                  </div>
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
