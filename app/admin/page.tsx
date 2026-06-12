"use client";

import { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../../lib/firebase";
import {
  resetGame,
  startGame,
  revealAnswer,
  nextQuestion,
  markPlayerStatus,
  setResurrectionCount,
  setFinalRound,
  sanitizeKey
} from "../../lib/game-actions";
import { GameState, Player, GameMode, PlayerStatus } from "../../lib/types";
import { questions } from "../../lib/questions";
import { GlassCard } from "../../components/ui/GlassCard";
import { PillButton } from "../../components/ui/PillButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ResurrectionLeaderboard, LeaderboardEntry } from "../../components/ui/ResurrectionLeaderboard";
import {
  Play,
  ArrowRight,
  Eye,
  ArrowsClockwise,
  Users,
  Heart,
  Skull,
  Trash,
  Sliders,
  Warning,
  EyeSlash,
  LockKey,
  LockOpen,
  Trophy
} from "@phosphor-icons/react";

export default function AdminPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [nextDiff, setNextDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [loading, setLoading] = useState(false);

  const handleResetGame = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await resetGame();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await startGame();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await revealAnswer();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await nextQuestion(nextDiff);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetResurrectionCount = async (count: number) => {
    if (loading) return;
    setLoading(true);
    try {
      await setResurrectionCount(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFinalRound = async (active: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      await setFinalRound(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const handleKickPlayer = async (name: string) => {
    if (confirm(`Bạn có chắc chắn muốn mời người chơi "${name}" ra khỏi phòng?`)) {
      const sanitized = sanitizeKey(name);
      await remove(ref(db, `players/${sanitized}`));
    }
  };

  if (!gameState) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505] text-white">
        <GlassCard className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#f59e0b] mx-auto animate-pulse">
            <Warning size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Chưa khởi tạo Database</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cơ sở dữ liệu phòng game trống hoặc chưa được thiết lập. Hãy nhấn nút bên dưới để thiết lập cấu hình phòng game trên Firebase của bạn.
            </p>
          </div>
          <PillButton onClick={handleResetGame} variant="primary" disabled={loading} className="w-full justify-center">
            Khởi Tạo Phòng Game
          </PillButton>
        </GlassCard>
      </main>
    );
  }

  const playerList = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
  const aliveCount = playerList.filter((p) => p.status === "alive").length;
  const deadCount = playerList.filter((p) => p.status === "dead").length;
  const winnerCount = playerList.filter((p) => p.status === "winner").length;
  const totalCount = playerList.length;

  const targetAnswerCount = gameState.mode === "survival"
    ? aliveCount
    : playerList.filter(p => p.status === "alive" || p.status === "dead").length;
    
  const submittedCount = playerList.filter(p => {
    const isContestant = gameState.mode === "survival"
      ? p.status === "alive"
      : p.status === "alive" || p.status === "dead";
    return isContestant && p.answer !== null && p.answer !== undefined;
  }).length;

  const currentQ = questions.find(q => q.id === gameState.activeQuestionId) || questions[gameState.currentQuestion - 1];

  // Calculate top 5 dead players who answered correctly for the current question
  let leaderboardEntries: LeaderboardEntry[] = [];
  if (gameState.phase === "reveal" && currentQ) {
    // A player "was dead" if they are still dead OR they were just resurrected this round
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
    <main className="flex min-h-[100dvh] flex-col bg-[#050505] text-white p-6 relative">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>HCM202 Admin Dashboard</span>
            <span className="text-xs px-2 py-0.5 font-mono uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
              Phase: {gameState.phase}
            </span>
            <span className={`text-xs px-2 py-0.5 font-mono uppercase rounded-full border ${
              gameState.mode === "survival" 
                ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}>
              Mode: {gameState.mode || "normal"}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Trình điều khiển trò chơi học tập Đúng / Sai & Hồi sinh
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <PillButton
            variant="secondary"
            onClick={handleResetGame}
            disabled={loading}
            icon={<ArrowsClockwise size={14} />}
          >
            Reset Game
          </PillButton>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Game Phase Controls (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Fallback warning banner */}
          {gameState.mode === "survival" && (!gameState.survivalContestants || gameState.survivalContestants.length === 0) && winnerCount < 3 && (
            <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-400 text-sm font-bold flex items-center gap-3 animate-pulse">
              <Warning size={20} />
              <div>
                Không còn người hợp lệ để tranh các slot còn thiếu. Vui lòng reset game hoặc xử lý thủ công.
              </div>
            </div>
          )}

          {/* Phase 1: Lobby View */}
          {gameState.phase === "lobby" && (
            <GlassCard>
              <div className="text-center py-12 space-y-6 max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2 glow-gold">
                  <Users size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white">Chờ Người Chơi</h2>
                  <p className="text-sm text-zinc-400">
                    Người chơi truy cập link game và nhập tên để hiển thị tại danh sách. Bấm bắt đầu để chạy câu đầu tiên.
                  </p>
                </div>
                <div className="pt-4">
                  <PillButton
                    onClick={handleStartGame}
                    variant="primary"
                    disabled={totalCount === 0 || loading}
                    icon={<Play size={14} weight="fill" />}
                    className="px-8 py-3.5"
                  >
                    Bắt đầu Trò chơi
                  </PillButton>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Phase 2: Question or Phase 3: Reveal View */}
          {(gameState.phase === "question" || gameState.phase === "reveal") && currentQ && (
            <div className="space-y-6">
              
              {/* Question card */}
              <GlassCard>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">Câu hỏi {gameState.currentQuestion}/30</span>
                      <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase">
                        {currentQ.difficulty === "easy" ? "Dễ" : currentQ.difficulty === "medium" ? "Trung bình" : "Khó"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {gameState.finalRound ? (
                        <span className="text-xs font-mono font-bold text-red-500 border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded-full tracking-wider">
                          🔥 CHUNG KẾT (KHÓA HỒI SINH)
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full tracking-wider">
                          🟢 VÒNG LOẠI (HỒI SINH BẬT)
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                    {currentQ.statement}
                  </h2>

                  <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5 items-start md:items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-zinc-500 block mb-1">Đáp án đúng</span>
                      <span className={`text-base font-bold px-3 py-1 rounded-full ${
                        currentQ.answer ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {currentQ.answer ? "ĐÚNG" : "SAI"}
                      </span>
                    </div>

                    {currentQ.explanation && (
                      <div className="flex-1 md:ml-6 max-w-md">
                        <span className="text-xs font-mono text-zinc-500 block mb-1">Giải thích</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">{currentQ.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Action Board */}
              <GlassCard>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                      Bảng điều khiển tác vụ
                    </span>
                    <Sliders size={16} className="text-zinc-500" />
                  </div>

                  {gameState.mode === "survival" ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                        ⚠️ Hồi sinh đã tự động tắt vì game đã vào Vòng Sinh Tồn.
                      </div>
                      
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                        <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">
                          🔥 CHI TIẾT THÔNG SỐ VÒNG TRANH SLOT
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
                          <div>Đã có: <strong className="text-white">{winnerCount} winner</strong></div>
                          <div>Còn thiếu: <strong className="text-white">{gameState.winnerSlotsRemaining ?? 3} slot</strong></div>
                          <div className="col-span-2">
                            Nhóm đang tranh: {gameState.survivalContestants && gameState.survivalContestants.length > 0 ? (
                              <span className="text-white font-bold">{gameState.survivalContestants.join(", ")}</span>
                            ) : (
                              <span className="text-red-400 font-bold">Trống</span>
                            )}
                          </div>
                          {gameState.resurrectedThisRound && gameState.resurrectedThisRound.length > 0 && (
                            <div className="col-span-2">
                              Hồi sinh vòng này: <span className="text-emerald-400 font-bold">{gameState.resurrectedThisRound.join(", ")}</span>
                            </div>
                          )}
                          {gameState.eliminatedThisRound && gameState.eliminatedThisRound.length > 0 && (
                            <div className="col-span-2">
                              Bị loại vòng này: <span className="text-zinc-500 font-bold">{gameState.eliminatedThisRound.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Resurrection count selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-mono text-zinc-400 uppercase">
                          Số lượng hồi sinh tối đa mỗi câu
                        </label>
                        <div className="flex items-center gap-2">
                          {[0, 1, 2, 3].map((num) => (
                            <button
                              key={num}
                              onClick={() => handleSetResurrectionCount(num)}
                              disabled={loading}
                              className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition-spring ${
                                gameState.resurrectionCount === num
                                  ? "bg-amber-500 text-black border-amber-500"
                                  : "bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/5"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Question Difficulty Selector (always visible) */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase">
                      Mức độ câu tiếp theo
                    </label>
                    <div className="flex items-center gap-2">
                      {(["easy", "medium", "hard"] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setNextDiff(diff)}
                          className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition-spring cursor-pointer ${
                            nextDiff === diff
                              ? "bg-amber-500 text-black border-amber-500"
                              : "bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/5"
                          }`}
                        >
                          {diff === "easy" ? "Dễ" : diff === "medium" ? "Trung bình" : "Khó"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main state transition action buttons */}
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    {gameState.phase === "question" ? (
                      <PillButton
                        onClick={handleRevealAnswer}
                        variant="primary"
                        disabled={loading}
                        icon={<Eye size={14} />}
                        className="flex-1 py-4"
                      >
                        Hiện Đáp Án (Hồi sinh)
                      </PillButton>
                    ) : (
                      <PillButton
                        onClick={handleNextQuestion}
                        variant="success"
                        disabled={loading}
                        icon={<ArrowRight size={14} />}
                        className="flex-1 py-4"
                      >
                        Chuyển Sang Câu Kế Tiếp
                      </PillButton>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Reveal Phase: Show Resurrection Leaderboard (only in normal mode) */}
              {gameState.phase === "reveal" && gameState.mode === "normal" && (
                <GlassCard>
                  <ResurrectionLeaderboard entries={leaderboardEntries} />
                </GlassCard>
              )}
            </div>
          )}

          {/* Phase 4: Finished View */}
          {gameState.phase === "finished" && (
            <GlassCard>
              <div className="text-center py-16 space-y-6 max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 glow-green">
                  <Trophy size={40} weight="fill" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white">Trò chơi hoàn tất!</h2>
                  <p className="text-sm text-zinc-400">
                    Tất cả 30 câu hỏi đã được hoàn thành. Dưới đây là danh sách những người chơi sống sót cuối cùng.
                  </p>
                </div>
                
                {playerList.filter(p => p.status === "winner").length > 0 ? (
                  <div className="pt-4 max-w-sm mx-auto">
                    <div className="text-xs uppercase font-mono tracking-wider text-zinc-500 mb-3 text-center">
                      👑 TOP 3 CHIẾN THẮNG CHUNG CUỘC
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {playerList
                        .filter(p => p.status === "winner")
                        .map(p => (
                          <span key={p.name} className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm">
                            {p.name}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-400 italic">Chưa có ai chiến thắng chung cuộc.</p>
                )}
              </div>
            </GlassCard>
          )}

        </div>

        {/* Right Side: Player Management list (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Danh sách người chơi</span>
                  <span className="text-xs font-mono font-normal text-zinc-500">({totalCount})</span>
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1" title="Sống"><span className="text-emerald-400">🟢</span> {aliveCount}</span>
                  <span className="flex items-center gap-1" title="Bị loại"><span className="text-red-400">💀</span> {deadCount}</span>
                  {winnerCount > 0 && (
                    <span className="flex items-center gap-1" title="Winner"><span className="text-amber-400">🏆</span> {winnerCount}</span>
                  )}
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400" title="Đã nộp">{submittedCount}/{targetAnswerCount}</span>
                </div>
              </div>

              {playerList.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                  Chưa có ai tham gia phòng.
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {playerList.map((player) => {
                    const isCorrect = player.answer === currentQ?.answer;
                    
                    return (
                      <div
                        key={player.name}
                        className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] transition-spring`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm max-w-[150px] truncate">{player.name}</span>
                          
                          {/* Display what they answered in real-time */}
                          {(gameState.phase === "question" || gameState.phase === "reveal") && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[10px] font-mono text-zinc-500">
                                {player.answer !== null && player.answer !== undefined ? (
                                  <span className={gameState.phase === "reveal" 
                                    ? (isCorrect ? "text-emerald-400 font-bold" : "text-red-400 font-bold")
                                    : "text-amber-400"
                                  }>
                                    Đã gửi: {player.answer ? "ĐÚNG" : "SAI"} 
                                    {player.answerTime && gameState.questionStartTime && (
                                      ` (${((player.answerTime - gameState.questionStartTime) / 1000).toFixed(1)}s)`
                                    )}
                                  </span>
                                ) : (
                                  "Chưa trả lời"
                                )}
                              </span>
                              {gameState.phase === "reveal" && (
                                <span className="text-[9px] font-mono text-zinc-400">
                                  KQ: <span className="text-white">{player.lastResult || "N/A"}</span> | Action: <span className="text-amber-400 font-semibold">{player.lastAction || "none"}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Live Status Toggle buttons (Admin overrides status by clicking) */}
                          <button
                            onClick={() =>
                              markPlayerStatus(
                                player.name,
                                player.status === "alive" 
                                  ? "dead" 
                                  : player.status === "dead" 
                                    ? "winner" 
                                    : "alive"
                              )
                            }
                            className={`p-1.5 rounded-full border transition-spring hover:scale-105 cursor-pointer ${
                              player.status === "alive"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : player.status === "winner"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-emerald-500/20"
                                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            }`}
                            title={`Status: ${player.status}. Bấm để đổi.`}
                          >
                            {player.status === "alive" ? (
                              <Heart size={14} weight="fill" />
                            ) : player.status === "winner" ? (
                              <Trophy size={14} weight="fill" />
                            ) : (
                              <Skull size={14} weight="fill" />
                            )}
                          </button>

                          <button
                            onClick={() => handleKickPlayer(player.name)}
                            className="p-1.5 rounded-full border border-white/5 bg-white/[0.02] text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-spring cursor-pointer"
                            title="Mời ra khỏi phòng"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </main>
  );
}
