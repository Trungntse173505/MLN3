import { ref, set, get, update, serverTimestamp } from "firebase/database";
import { db } from "./firebase";
import { Player, GamePhase, GameState, GameMode, PlayerStatus } from "./types";
import { questions } from "./questions";

export function sanitizeKey(key: string): string {
  return key.replace(/[\.\#\$\/\[\]]/g, "_").trim();
}

// Initialize/Reset game to lobby
export async function resetGame() {
  await set(ref(db, "gameState"), {
    phase: "lobby" as GamePhase,
    mode: "normal" as GameMode,
    currentQuestion: 1,
    activeQuestionId: null,
    questionStartTime: null,
    resurrectionCount: 1,
    usedQuestionIds: null,
    eliminatedThisRound: null,
    resurrectedThisRound: null,
    winnersThisRound: null,
    eliminationQuota: null,
    winnerSlotsRemaining: null,
    survivalContestants: null,
    onlyOneWinnerPerQuestion: false,
    finalRound: false,
    resultsCalculated: false,
    resultsApplied: false,
    additionalEliminationCount: 0,
    pendingEliminations: null,
    pendingAdditionalEliminations: null,
    pendingResurrections: null
  });

  const playersRef = ref(db, "players");
  const snapshot = await get(playersRef);
  if (snapshot.exists()) {
    const updates: Record<string, any> = {};
    snapshot.forEach((child) => {
      const key = child.key;
      if (key) {
        updates[`players/${key}/status`] = "alive" as PlayerStatus;
        updates[`players/${key}/answer`] = null;
        updates[`players/${key}/answerTime`] = null;
        updates[`players/${key}/lastResult`] = null;
        updates[`players/${key}/lastAction`] = null;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  }
}

// Join game
export async function joinGame(name: string): Promise<boolean> {
  const sanitized = sanitizeKey(name);
  if (!sanitized) return false;

  const playerRef = ref(db, `players/${sanitized}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    return true; // Already joined
  }

  const newPlayer: Player = {
    name: name.trim(),
    status: "alive" as PlayerStatus,
    answer: null,
    answerTime: null,
    joinedAt: Date.now()
  };

  await set(playerRef, newPlayer);
  return true;
}

// Admin starts the game
export async function startGame() {
  const easyQuestions = questions.filter(q => q.difficulty === "easy");
  const randomIndex = Math.floor(Math.random() * easyQuestions.length);
  const selectedQuestion = easyQuestions[randomIndex];

  await update(ref(db, "gameState"), {
    phase: "question" as GamePhase,
    mode: "normal" as GameMode,
    currentQuestion: 1,
    activeQuestionId: selectedQuestion.id,
    questionStartTime: serverTimestamp(),
    usedQuestionIds: { [selectedQuestion.id]: true },
    eliminatedThisRound: null,
    resurrectedThisRound: null,
    winnersThisRound: null,
    eliminationQuota: null,
    winnerSlotsRemaining: null,
    survivalContestants: null,
    onlyOneWinnerPerQuestion: false,
    finalRound: false,
    resultsCalculated: false,
    resultsApplied: false,
    additionalEliminationCount: 0,
    pendingEliminations: null,
    pendingAdditionalEliminations: null,
    pendingResurrections: null
  });
  await resetAllAnswers();
}

// Reset answers for a new question
async function resetAllAnswers() {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const playersRef = ref(db, "players");
  const snapshot = await get(playersRef);
  if (!snapshot.exists()) return;

  const updates: Record<string, any> = {};
  snapshot.forEach((child) => {
    const key = child.key;
    const player = child.val();
    if (key) {
      const status = player.status || "alive";
      const isAllowed = status === "alive" || status === "dead";

      if (isAllowed) {
        updates[`players/${key}/answer`] = null;
        updates[`players/${key}/answerTime`] = null;
        updates[`players/${key}/lastResult`] = null;
        updates[`players/${key}/lastAction`] = "waiting";
      } else {
        updates[`players/${key}/answer`] = null;
        updates[`players/${key}/answerTime`] = null;
        updates[`players/${key}/lastResult`] = null;
        updates[`players/${key}/lastAction`] = null;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}

// Submit answer for a player
export async function submitAnswer(name: string, answer: boolean) {
  const sanitized = sanitizeKey(name);
  const playerRef = ref(db, `players/${sanitized}`);

  const stateSnap = await get(ref(db, "gameState"));
  const playerSnap = await get(playerRef);
  if (!stateSnap.exists() || !playerSnap.exists()) return;

  const state = stateSnap.val();
  const player = playerSnap.val();

  if (state.phase !== "question") return;

  const status = player.status || "alive";
  const isAllowed = status === "alive" || status === "dead";

  if (!isAllowed) return;

  // Khóa không cho sửa đáp án sau khi đã nộp
  if (player.answer !== null && player.answer !== undefined) return;

  await update(playerRef, {
    answer,
    answerTime: serverTimestamp()
  });
}

// Mark player status manually
export async function markPlayerStatus(name: string, status: PlayerStatus) {
  const sanitized = sanitizeKey(name);
  await update(ref(db, `players/${sanitized}`), {
    status
  });
}

// Set resurrection count limit
export async function setResurrectionCount(count: number) {
  await update(ref(db, "gameState"), {
    resurrectionCount: count
  });
}

// Toggle final round (legacy compatibility)
export async function setFinalRound(active: boolean) {
  await update(ref(db, "gameState"), {
    finalRound: active
  });
}

// Reveal answer and calculate pending results
export async function revealAnswer() {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();
  const currentQ = questions.find(q => q.id === state.activeQuestionId) || questions[state.currentQuestion - 1];
  if (!currentQ) return;

  const playersRef = ref(db, "players");
  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};

  const playersList = Object.values(players);
  const correctAnswer = currentQ.answer;

  const alivePlayers = playersList.filter(p => p.status === "alive");
  const deadPlayers = playersList.filter(p => p.status === "dead");

  // 1. Calculate pending eliminations (alive players who answered wrong or didn't answer)
  const pendingEliminations: string[] = [];
  alivePlayers.forEach(p => {
    const isCorrect = p.answer === correctAnswer;
    const answered = p.answer !== null && p.answer !== undefined;
    if (!isCorrect || !answered) {
      pendingEliminations.push(p.name);
    }
  });

  // 2. Calculate pending resurrection (Q2+ only, max 1 dead player who answered correct and fastest)
  const pendingResurrections: string[] = [];
  if (state.currentQuestion > 1) {
    const deadCorrectCandidates = deadPlayers.filter(
      p => p.answer === correctAnswer && p.answerTime != null
    );
    // Sort by answerTime asc (fastest first)
    deadCorrectCandidates.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));
    if (deadCorrectCandidates.length > 0) {
      pendingResurrections.push(deadCorrectCandidates[0].name);
    }
  }

  await update(stateRef, {
    phase: "reveal" as GamePhase,
    resultsCalculated: true,
    resultsApplied: false,
    additionalEliminationCount: 0,
    pendingEliminations,
    pendingAdditionalEliminations: [],
    pendingResurrections,
    eliminatedThisRound: null,
    resurrectedThisRound: null,
    winnersThisRound: null
  });
}

// Select additional slow correct alive players to eliminate
export async function setAdditionalEliminationCount(count: number) {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();
  const currentQ = questions.find(q => q.id === state.activeQuestionId) || questions[state.currentQuestion - 1];
  if (!currentQ) return;

  const playersRef = ref(db, "players");
  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};

  const playersList = Object.values(players);
  const correctAnswer = currentQ.answer;

  const aliveCorrect = playersList.filter(
    p => p.status === "alive" && p.answer === correctAnswer && p.answerTime != null
  );

  // Sort by answerTime desc (slowest first)
  aliveCorrect.sort((a, b) => (b.answerTime || 0) - (a.answerTime || 0));

  // Limit count to correct alive players length
  const finalCount = Math.max(0, Math.min(count, aliveCorrect.length));
  const pendingAdditionalEliminations = aliveCorrect.slice(0, finalCount).map(p => p.name);

  await update(stateRef, {
    additionalEliminationCount: finalCount,
    pendingAdditionalEliminations
  });
}

// Confirm round results: apply pending results to database
export async function applyRoundResults() {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();
  if (!state.resultsCalculated || state.resultsApplied) return;

  const currentQ = questions.find(q => q.id === state.activeQuestionId) || questions[state.currentQuestion - 1];
  if (!currentQ) return;
  const correctAnswer = currentQ.answer;

  const playersRef = ref(db, "players");
  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};
  const playersList = Object.values(players);

  const pendingElim = state.pendingEliminations || [];
  const pendingAddElim = state.pendingAdditionalEliminations || [];
  const pendingResurrect = state.pendingResurrections || [];

  const dbUpdates: Record<string, any> = {};

  playersList.forEach(p => {
    const sanitized = sanitizeKey(p.name);
    let newStatus = p.status;
    let lastAction = p.lastAction || "waiting";
    let lastResult: "correct" | "wrong" | "no_answer" = "no_answer";

    // Set lastResult
    if (p.answer === null || p.answer === undefined) {
      lastResult = "no_answer";
    } else if (p.answer === correctAnswer) {
      lastResult = "correct";
    } else {
      lastResult = "wrong";
    }

    if (p.status === "winner") {
      newStatus = "winner";
      lastAction = "winner_locked";
    } else if (pendingElim.includes(p.name) || pendingAddElim.includes(p.name)) {
      newStatus = "dead";
      lastAction = "eliminated";
    } else if (pendingResurrect.includes(p.name)) {
      newStatus = "alive";
      lastAction = "resurrected";
    } else if (p.status === "alive") {
      newStatus = "alive";
      lastAction = "survived";
    } else {
      newStatus = "dead";
      lastAction = "waiting";
    }

    dbUpdates[`players/${sanitized}/status`] = newStatus;
    dbUpdates[`players/${sanitized}/lastAction`] = lastAction;
    dbUpdates[`players/${sanitized}/lastResult`] = lastResult;
  });

  if (Object.keys(dbUpdates).length > 0) {
    await update(ref(db), dbUpdates);
  }

  // Combine eliminated names for record
  const eliminatedNames = [...pendingElim, ...pendingAddElim];

  await update(stateRef, {
    resultsApplied: true,
    eliminatedThisRound: eliminatedNames.length > 0 ? eliminatedNames : null,
    resurrectedThisRound: pendingResurrect.length > 0 ? pendingResurrect : null,
    pendingEliminations: null,
    pendingAdditionalEliminations: null,
    pendingResurrections: null
  });
}

// Advance to next question manually
export async function nextQuestion(difficulty: "easy" | "medium" | "hard" = "easy") {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();

  // If question list is exhausted, do not automatically finish game.
  // Instead, the Admin has to click KẾT THÚC GAME.
  const usedIds: Record<string, boolean> = state.usedQuestionIds || {};
  const usedCount = Object.keys(usedIds).length;

  if (usedCount >= questions.length) {
    return;
  }

  let availableQuestions = questions.filter(q => q.difficulty === difficulty && !usedIds[q.id]);
  if (availableQuestions.length === 0) {
    availableQuestions = questions.filter(q => !usedIds[q.id]);
  }

  if (availableQuestions.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const nextQuestionObj = availableQuestions[randomIndex];

  const updatedUsedIds = { ...usedIds, [nextQuestionObj.id]: true };
  const nextRound = state.currentQuestion + 1;

  await update(stateRef, {
    phase: "question" as GamePhase,
    mode: "normal" as GameMode,
    currentQuestion: nextRound,
    activeQuestionId: nextQuestionObj.id,
    questionStartTime: serverTimestamp(),
    usedQuestionIds: updatedUsedIds,
    
    // Clear all round details and pending fields
    resultsCalculated: false,
    resultsApplied: false,
    additionalEliminationCount: 0,
    pendingEliminations: null,
    pendingAdditionalEliminations: null,
    pendingResurrections: null,
    eliminatedThisRound: null,
    resurrectedThisRound: null,
    winnersThisRound: null,
    survivalContestants: null
  });

  await resetAllAnswers();
}

// Finish the game: make remaining alive players winners
export async function finishGame() {
  const stateRef = ref(db, "gameState");
  const playersRef = ref(db, "players");

  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};
  const playersList = Object.values(players);

  const dbUpdates: Record<string, any> = {};

  playersList.forEach(p => {
    const sanitized = sanitizeKey(p.name);
    if (p.status === "alive") {
      dbUpdates[`players/${sanitized}/status`] = "winner" as PlayerStatus;
      dbUpdates[`players/${sanitized}/lastAction`] = "winner_locked";
    }
  });

  if (Object.keys(dbUpdates).length > 0) {
    await update(ref(db), dbUpdates);
  }

  await update(stateRef, {
    phase: "finished" as GamePhase,
    resultsCalculated: false,
    resultsApplied: false,
    additionalEliminationCount: 0,
    pendingEliminations: null,
    pendingAdditionalEliminations: null,
    pendingResurrections: null,
    eliminatedThisRound: null,
    resurrectedThisRound: null,
    winnersThisRound: null,
    survivalContestants: null
  });
}


