export type GamePhase = 'lobby' | 'question' | 'reveal' | 'finished';
export type GameMode = 'normal' | 'survival';
export type PlayerStatus = 'alive' | 'dead' | 'winner';

export interface Player {
  name: string;
  status: PlayerStatus;
  answer: boolean | null; // true = Đúng, false = Sai, null = Chưa trả lời / Không trả lời
  answerTime: number | null; // millisecond timestamp
  joinedAt: number;
  lastResult?: "correct" | "wrong" | "no_answer";
  lastAction?:
    | "waiting"
    | "survived"
    | "eliminated"
    | "resurrected"
    | "winner_locked";
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  currentQuestion: number; // 1-indexed (1 to 30)
  activeQuestionId: number | null; // The actual question ID being shown (1 to 30)
  questionStartTime: number | null; // timestamp in ms when current question started
  resurrectionCount: number; // Number of players to resurrect (0, 1, 2, ...)
  usedQuestionIds?: Record<string, boolean>; // Record of asked question IDs
  eliminatedThisRound?: string[] | null;
  resurrectedThisRound?: string[] | null;
  winnersThisRound?: string[] | null;
  eliminationQuota?: number;
  winnerSlotsRemaining?: number;
  survivalContestants?: string[] | null;
  onlyOneWinnerPerQuestion?: boolean;
  finalRound?: boolean; // legacy compatibility
  pendingEliminations?: string[] | null;
  pendingAdditionalEliminations?: string[] | null;
  pendingResurrections?: string[] | null;
  resultsCalculated?: boolean;
  resultsApplied?: boolean;
  additionalEliminationCount?: number;
}

