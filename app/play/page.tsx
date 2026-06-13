"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../lib/firebase";
import { joinGame, submitAnswer, sanitizeKey } from "../../lib/game-actions";
import { GameState, Player, GameMode, PlayerStatus } from "../../lib/types";
import { questions } from "../../lib/questions";
import { GlassCard } from "../../components/ui/GlassCard";
import { PillButton } from "../../components/ui/PillButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Check, X, ArrowRight, Trophy, Ghost, ShieldCheck, Heart, Warning } from "@phosphor-icons/react";

export default function PlayPage() {
  const [playerName, setPlayerName] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Check local storage on mount
  useEffect(() => {
    const initPlayer = async () => {
      const savedName = localStorage.getItem("playerName");
      if (savedName) {
        setPlayerName(savedName);
        const ok = await joinGame(savedName);
        if (ok) {
          setIsRegistered(true);
        }
      }
    };
    initPlayer();
  }, []);

  // Listen to global GameState
  useEffect(() => {
    const stateRef = ref(db, "gameState");
    return onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });
  }, []);

  // Listen to current Player's status and answer
  useEffect(() => {
    if (!isRegistered || !playerName) return;
    const sanitized = sanitizeKey(playerName);
    const playerRef = ref(db, `players/${sanitized}`);

    return onValue(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const val: Player = snapshot.val();
        setPlayerData(val);
        setSelectedAnswer(val.answer ?? null);
      } else {
        // If player deleted from DB, reset local
        setIsRegistered(false);
        localStorage.removeItem("playerName");
      }
    });
  }, [isRegistered, playerName]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const ok = await joinGame(playerName);
    if (ok) {
      localStorage.setItem("playerName", playerName.trim());
      setIsRegistered(true);
    } else {
      setErrorMsg("Tên không hợp lệ.");
    }
  };

  // Reset selectedAnswer when question changes to prevent stale state
  useEffect(() => {
    if (gameState?.phase === "question") {
      setSelectedAnswer(null);
      setErrorMsg("");
    }
  }, [gameState?.currentQuestion, gameState?.phase]);

  const handleSelectAnswer = async (ans: boolean) => {
    if (selectedAnswer !== null) return; // cannot change answer once submitted
    setSelectedAnswer(ans);
    try {
      await submitAnswer(playerName, ans);
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setSelectedAnswer(null); // Reset so they can retry
      setErrorMsg("Gửi đáp án thất bại, vui lòng thử lại!");
    }
  };

  const handleExit = () => {
    localStorage.removeItem("playerName");
    setPlayerName("");
    setIsRegistered(false);
    setPlayerData(null);
  };

  if (!isRegistered) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505] overflow-x-hidden">
        <GlassCard className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
              <Trophy size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              MLN131 — Đúng hay Sai
            </h1>
            <p className="text-zinc-400 text-sm">
              Nhập tên của bạn để tham gia lớp học
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Họ và Tên
              </label>
              <input
                id="name"
                type="text"
                maxLength={25}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-spring"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-mono">{errorMsg}</p>
            )}

            <PillButton type="submit" variant="primary" icon={<ArrowRight size={14} />} className="w-full">
              Vào Phòng Chờ
            </PillButton>
          </form>
        </GlassCard>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505] text-white">
        <GlassCard className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#f59e0b] mx-auto animate-pulse">
            <Warning size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Chờ Ban Tổ Chức</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Phòng game chưa được khởi tạo. Vui lòng đợi Ban tổ chức/Admin thiết lập phòng game trên máy chiếu.
            </p>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (!playerData) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#050505]">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">
          Đang kết nối tải thông tin người chơi...
        </div>
      </main>
    );
  }

  const currentQ = questions.find(q => q.id === gameState.activeQuestionId) || questions[gameState.currentQuestion - 1];
  const isContestant = gameState.survivalContestants
    ? gameState.survivalContestants.includes(playerData.name)
    : true;
  const isAllowedToAnswer = (gameState.mode === "normal" && (playerData.status === "alive" || playerData.status === "dead")) ||
    (gameState.mode === "survival" && playerData.status === "alive" && isContestant);

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#050505] p-4 text-white relative">
      {/* Mobile Top Navigation & Status Bar */}
      <header className="flex items-center justify-between py-4 border-b border-white/5 mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Người chơi</span>
          <span className="font-bold text-white text-base max-w-[150px] truncate">{playerData.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={playerData.status} />
          <button onClick={handleExit} className="text-xs font-mono text-zinc-500 hover:text-white px-2 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/5 transition-spring">
            Thoát
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-8">

        {/* Phase 1: LOBBY */}
        {gameState.phase === "lobby" && (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 text-amber-500 glow-gold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Bạn đã ở trong phòng chờ!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Đang chờ thầy cô/Admin khởi chạy trò chơi. Hãy chú ý màn hình máy chiếu của lớp học.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: QUESTION */}
        {gameState.phase === "question" && currentQ && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-zinc-500">Câu hỏi {gameState.currentQuestion}/{questions.length}</span>
              {gameState.mode === "survival" && (
                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                  🔥 SINH TỒN
                </span>
              )}
            </div>

            <GlassCard>
              <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                {currentQ.statement}
              </p>
            </GlassCard>
            {/* Interactive Web Answering Controls */}
            {isAllowedToAnswer ? (
              <div className="space-y-4">
                <div className="text-center text-xs font-mono tracking-wider text-zinc-500 uppercase px-2 leading-relaxed">
                  {gameState.mode === "normal" ? (
                    playerData.status === "alive"
                      ? (playerData.lastAction === "resurrected"
                        ? "🎉 Bạn đã được hồi sinh và đang tranh suất Top 3."
                        : "🟢 Bạn đang còn sống. Hãy trả lời để tiếp tục sống sót.")
                      : "💀 Bạn đã bị loại, nhưng vẫn có thể tranh hồi sinh. Trả lời đúng và nhanh nhất để quay lại game."
                  ) : (
                    playerData.lastAction === "resurrected"
                      ? "🎉 Bạn đã được hồi sinh và đang tranh suất Top 3."
                      : "🔥 Bạn đang tranh suất chiến thắng còn lại. Hãy trả lời đúng và nhanh nhất."
                  )}
                </div>

                {errorMsg && (
                  <div className="text-center text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                    {errorMsg}
                  </div>
                )}

                {selectedAnswer === null ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSelectAnswer(true)}
                      className="flex flex-col items-center justify-center py-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-spring cursor-pointer"
                    >
                      <Check size={32} weight="bold" className="mb-2" />
                      <span className="font-bold text-sm">ĐÚNG</span>
                    </button>

                    <button
                      onClick={() => handleSelectAnswer(false)}
                      className="flex flex-col items-center justify-center py-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-spring cursor-pointer"
                    >
                      <X size={32} weight="bold" className="mb-2" />
                      <span className="font-bold text-sm">SAI</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-[#f59e0b] mb-3">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-sm font-semibold mb-1">Đã ghi nhận câu trả lời!</p>
                    <p className="text-xs text-zinc-500">
                      Đáp án của bạn: <span className="font-mono font-bold text-zinc-300">{selectedAnswer ? "ĐÚNG" : "SAI"}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : playerData.status === "winner" ? (
              /* Winner mode */
              <div className="text-center p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 glow-gold space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-[#f59e0b] animate-bounce glow-gold">
                  <Trophy size={24} weight="fill" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-400 text-base">Bạn đã chắc suất chiến thắng 🎉</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed px-4">
                    Chúc mừng bạn đã xuất sắc giành được tấm vé vàng chiến thắng chung cuộc! Hãy cùng chờ game tìm đủ Top 3 nhé.
                  </p>
                </div>
              </div>
            ) : (
              /* Spectator mode for Dead players in Survival Round / players not allowed to answer */
              <div className="text-center p-8 rounded-2xl bg-red-500/5 border border-red-500/20 glow-red space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400">
                  <Ghost size={24} weight="fill" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-red-400 text-base">
                    {gameState.mode === "survival" && !isContestant ? "Bạn đã bị loại khỏi vòng tranh suất." : "BẠN ĐÃ BỊ LOẠI"}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed px-4">
                    {gameState.mode === "survival" && !isContestant
                      ? "Vòng sinh tồn đã bắt đầu và bạn không nằm trong danh sách tranh suất. Hãy theo dõi các bạn khác thi đấu!"
                      : "Vòng sinh tồn đã bắt đầu và tính năng hồi sinh đã bị khóa. Hãy theo dõi các bạn còn lại thi đấu!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 3: REVEAL */}
        {gameState.phase === "reveal" && currentQ && (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xs font-mono text-zinc-500 text-center">Kết quả câu {gameState.currentQuestion}</h3>

            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${currentQ.answer ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                    {currentQ.answer ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">Đáp án chính xác</span>
                </div>
                <div className={`text-xl font-bold tracking-wide ${currentQ.answer ? "text-emerald-400" : "text-red-400"}`}>
                  {currentQ.answer ? "ĐÚNG" : "SAI"}
                </div>
                {currentQ.explanation && (
                  <p className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-white/5">
                    {currentQ.explanation}
                  </p>
                )}
              </div>
            </GlassCard>

            {/* Check personal status */}
            {!gameState.resultsApplied ? (
              <div className="text-center p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#f59e0b] space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-[#f59e0b] animate-pulse">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-sm">Đã ghi nhận kết quả.</h3>
                <p className="text-xs text-zinc-400">Đang chờ Admin xác nhận vòng chơi.</p>
              </div>
            ) : playerData.status === "winner" ? (
              <div className="text-center p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 glow-gold space-y-3">
                <div className="text-2xl">🏆 ⭐ 🏆</div>
                <h3 className="font-bold text-amber-400 text-lg">CHẮC SUẤT CHIẾN THẮNG!</h3>
                <p className="text-xs text-zinc-300 px-4 leading-relaxed">
                  {gameState.winnersThisRound?.includes(playerData.name)
                    ? "Chúc mừng bạn đã xuất sắc giành được 1 trong 3 tấm vé vàng chiến thắng chung cuộc! 👑"
                    : "Bạn đã an toàn trong nhóm chiến thắng. Hãy cùng chờ đón các nhà vô địch tiếp theo."}
                </p>
              </div>
            ) : gameState.resurrectedThisRound?.includes(playerData.name) ? (
              <div className="text-center p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 glow-gold space-y-3">
                <div className="text-2xl">🎉 🌟 🎉</div>
                <h3 className="font-bold text-amber-400 text-lg">BẠN ĐÃ ĐƯỢC HỒI SINH!</h3>
              </div>
            ) : playerData.status === "dead" ? (
              <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 opacity-80">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-zinc-400">
                  <Ghost size={20} />
                </div>
                <h3 className="font-semibold text-zinc-400 text-sm">
                  {gameState.mode === "survival" && !isContestant
                    ? "Bạn đã bị loại khỏi vòng tranh suất."
                    : (gameState.eliminatedThisRound?.includes(playerData.name) ? "BẠN ĐÃ BỊ LOẠI 💀" : "Vẫn đang bị loại 💀")}
                </h3>
                <p className="text-xs text-zinc-500 px-6 leading-relaxed">
                  {gameState.mode === "survival" && !isContestant
                    ? "Rất tiếc, bạn đã bị loại khỏi vòng tranh suất chiến thắng. Hãy tiếp tục theo dõi diễn biến trận đấu nhé!"
                    : (gameState.eliminatedThisRound?.includes(playerData.name) ? (
                      selectedAnswer === currentQ.answer
                        ? "Bạn đã trả lời ĐÚNG nhưng chậm nhất và bị loại để đủ quota. Cố gắng ở câu sau!"
                        : "Bạn đã trả lời SAI hoặc không trả lời kịp nên đã bị loại. Cố gắng ở câu sau!"
                    ) : (
                      gameState.mode === "survival"
                        ? "Vòng sinh tồn đã bắt đầu nên cơ hội hồi sinh đã đóng. Hãy theo dõi tiếp nhé!"
                        : selectedAnswer === currentQ.answer
                          ? "Bạn trả lời ĐÚNG nhưng chưa đủ nhanh để lọt top hồi sinh. Cố gắng thêm ở câu sau!"
                          : "Bạn trả lời chưa chính xác. Hãy ôn lại kiến thức và canh câu sau nhé!"
                    ))}
                </p>
              </div>
            ) : (
              <div className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 glow-green space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-emerald-400 text-sm">Bạn vẫn an toàn!</h3>
                <p className="text-xs text-zinc-400">Tiếp tục duy trì trạng thái nhé.</p>
              </div>
            )}
          </div>
        )}

        {/* Phase 4: FINISHED */}
        {gameState.phase === "finished" && (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 glow-gold">
              <Trophy size={32} weight="fill" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">TRÒ CHƠI KẾT THÚC</h2>
            </div>

            <div className={`p-6 rounded-2xl border ${playerData.status === "winner" || playerData.status === "alive"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 glow-green"
              : "bg-red-500/10 border-red-500/30 text-red-300 glow-red"
              }`}>
              <span className="text-sm font-mono block mb-1">Kết quả</span>
              <span className="text-lg font-bold tracking-wider">
                {playerData.status === "winner" || playerData.status === "alive" ? "👑 CHIẾN THẮNG!" : "💀 ĐÃ BỊ LOẠI"}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
