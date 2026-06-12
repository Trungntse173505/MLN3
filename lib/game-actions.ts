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
    eliminationQuota: 5,
    winnerSlotsRemaining: 3,
    survivalContestants: null,
    onlyOneWinnerPerQuestion: false,
    finalRound: false
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
    eliminationQuota: 5,
    winnerSlotsRemaining: 3,
    survivalContestants: null,
    onlyOneWinnerPerQuestion: false,
    finalRound: false
  });
  await resetAllAnswers();
}

// Reset answers for a new question
async function resetAllAnswers() {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;
  const state = stateSnap.val();
  const mode = state.mode || "normal";

  const playersRef = ref(db, "players");
  const snapshot = await get(playersRef);
  if (!snapshot.exists()) return;

  const updates: Record<string, any> = {};
  snapshot.forEach((child) => {
    const key = child.key;
    const player = child.val();
    if (key) {
      const status = player.status || "alive";
      // Determine if player is allowed to answer
      const isContestant = state.survivalContestants 
        ? (state.survivalContestants.includes(player.name) || state.survivalContestants.includes(key))
        : true;
      const isAllowed = (mode === "normal" && (status === "alive" || status === "dead")) ||
                        (mode === "survival" && status === "alive" && isContestant);

      if (isAllowed) {
        updates[`players/${key}/answer`] = null;
        updates[`players/${key}/answerTime`] = null;
        if (player.lastAction === "resurrected") {
          // Keep resurrected status so player UI knows they were resurrected
        } else {
          updates[`players/${key}/lastAction`] = "waiting";
        }
      } else {
        updates[`players/${key}/answer`] = null;
        updates[`players/${key}/answerTime`] = null;
        if (status === "winner") {
          updates[`players/${key}/lastAction`] = "winner_locked";
        }
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

  const mode = state.mode || "normal";
  const status = player.status || "alive";

  const isContestant = state.survivalContestants 
    ? (state.survivalContestants.includes(player.name) || state.survivalContestants.includes(sanitized))
    : true;
  const isAllowed = (mode === "normal" && (status === "alive" || status === "dead")) ||
                    (mode === "survival" && status === "alive" && isContestant);

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

// Reveal answer and handle resurrection
export async function revealAnswer() {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();
  const mode = state.mode || "normal";
  const currentQ = questions.find(q => q.id === state.activeQuestionId) || questions[state.currentQuestion - 1];
  if (!currentQ) return;

  const playersRef = ref(db, "players");
  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};

  const playersList = Object.values(players);
  const correctAnswer = currentQ.answer;

  // 1. Create Snapshots BEFORE any state changes
  const aliveBefore = playersList.filter(p => p.status === "alive");
  const deadBefore = playersList.filter(p => p.status === "dead");
  const winnersBefore = playersList.filter(p => p.status === "winner");

  const aliveCorrect = aliveBefore.filter(p => p.answer === correctAnswer);
  const aliveWrong = aliveBefore.filter(p => p.answer !== correctAnswer);
  const deadCorrectCandidates = deadBefore.filter(p => p.answer === correctAnswer && p.answerTime != null);

  let eliminatedNames: string[] = [];
  let resurrectedNames: string[] = [];
  let winnerNames: string[] = [];
  let newPhase: GamePhase = "reveal";
  let newMode: GameMode = mode;
  let newResurrectionCount = state.resurrectionCount;
  let newOnlyOneWinnerPerQuestion = state.onlyOneWinnerPerQuestion || false;
  let newSurvivalContestants: string[] | null = state.survivalContestants ? [...state.survivalContestants] : null;

  const dbUpdates: Record<string, any> = {};

  if (mode === "normal") {
    if (aliveBefore.length > 5) {
      if (aliveCorrect.length <= 3) {
        // COLLAPSE BRANCH!
        if (aliveCorrect.length === 3) {
          // Section 5: 3 winners, game finished, ignore resurrection
          winnerNames = aliveCorrect.map(p => p.name);
          eliminatedNames = aliveWrong.map(p => p.name);
          newPhase = "finished";
          newResurrectionCount = 0;
          newSurvivalContestants = null;
        } else {
          // Sections 6, 7, 8
          winnerNames = aliveCorrect.map(p => p.name);

          // Calculate resurrection
          if (state.resurrectionCount > 0) {
            const sortedDeadCandidates = [...deadCorrectCandidates].sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));
            const toResurrect = sortedDeadCandidates.slice(0, state.resurrectionCount);
            resurrectedNames = toResurrect.map(p => p.name);
          }

          const aliveWrongNames = aliveWrong.map(p => p.name);
          newSurvivalContestants = Array.from(new Set([...aliveWrongNames, ...resurrectedNames]));
          newMode = "survival";
          newResurrectionCount = 0;
          newPhase = "reveal";

          if (aliveCorrect.length === 0) {
            // Special rule for 0 correct
            newOnlyOneWinnerPerQuestion = true;
          }
        }
      } else {
        // Standard normal mode elimination quota
        const eliminationQuota = state.currentQuestion === 1 ? 5 : 2;
        let toEliminateList: Player[] = [...aliveWrong];

        if (toEliminateList.length < eliminationQuota) {
          const correctAliveSortedBySlowest = [...aliveCorrect].sort((a, b) => {
            const timeA = a.answerTime || 0;
            const timeB = b.answerTime || 0;
            return timeB - timeA;
          });
          const needed = eliminationQuota - toEliminateList.length;
          const additional = correctAliveSortedBySlowest.slice(0, needed);
          toEliminateList = [...toEliminateList, ...additional];
        }

        eliminatedNames = toEliminateList.map(p => p.name);

        if (state.resurrectionCount > 0) {
          const sortedDeadCandidates = [...deadCorrectCandidates].sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));
          const toResurrect = sortedDeadCandidates.slice(0, state.resurrectionCount);
          resurrectedNames = toResurrect.map(p => p.name);
        }
        newPhase = "reveal";
      }
    } else {
      // aliveBefore.length <= 5 but mode === "normal"
      const eliminationQuota = state.currentQuestion === 1 ? 5 : 2;
      let toEliminateList: Player[] = [...aliveWrong];

      if (toEliminateList.length < eliminationQuota) {
        const correctAliveSortedBySlowest = [...aliveCorrect].sort((a, b) => {
          const timeA = a.answerTime || 0;
          const timeB = b.answerTime || 0;
          return timeB - timeA;
        });
        const needed = eliminationQuota - toEliminateList.length;
        const additional = correctAliveSortedBySlowest.slice(0, needed);
        toEliminateList = [...toEliminateList, ...additional];
      }

      eliminatedNames = toEliminateList.map(p => p.name);

      if (state.resurrectionCount > 0) {
        const sortedDeadCandidates = [...deadCorrectCandidates].sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));
        const toResurrect = sortedDeadCandidates.slice(0, state.resurrectionCount);
        resurrectedNames = toResurrect.map(p => p.name);
      }
      newPhase = "reveal";
    }
  } else {
    // mode === "survival"
    const contestants = aliveBefore.filter(p => !state.survivalContestants || state.survivalContestants.includes(p.name));
    const winnerCount = winnersBefore.length;
    const slotsRemaining = 3 - winnerCount;

    const correctContestants = contestants.filter(p => p.answer === correctAnswer);
    const wrongContestants = contestants.filter(p => p.answer !== correctAnswer);
    const correctContestantsSortedByTimeAsc = [...correctContestants].sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));

    if (newOnlyOneWinnerPerQuestion) {
      // Special 1 winner per question logic (Section 9)
      if (correctContestants.length === 0) {
        winnerNames = [];
        eliminatedNames = [];
        newPhase = "reveal";
      } else {
        const fastestWinner = correctContestantsSortedByTimeAsc[0];
        winnerNames = [fastestWinner.name];
        eliminatedNames = wrongContestants.map(p => p.name);

        const correctSlowerNames = correctContestantsSortedByTimeAsc.slice(1).map(p => p.name);
        newSurvivalContestants = Array.from(new Set(correctSlowerNames));

        const remainingSlots = slotsRemaining - 1;
        newPhase = remainingSlots <= 0 ? "finished" : "reveal";
      }
    } else if (winnerCount === 0 && contestants.length === 5) {
      // Classic Top 5 survival mode case (Case A)
      if (correctContestants.length === 5) {
        const slowest = correctContestantsSortedByTimeAsc[4];
        eliminatedNames = [slowest.name];
        winnerNames = [];
        newPhase = "reveal";
        newSurvivalContestants = contestants.filter(p => p.name !== slowest.name).map(p => p.name);
      } else if (correctContestants.length === 4) {
        eliminatedNames = wrongContestants.map(p => p.name);
        winnerNames = [];
        newPhase = "reveal";
        newSurvivalContestants = correctContestants.map(p => p.name);
      } else if (correctContestants.length === 3) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = wrongContestants.map(p => p.name);
        newPhase = "finished";
        newSurvivalContestants = [];
      } else if (correctContestants.length === 2) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = wrongContestants.map(p => p.name);
      } else if (correctContestants.length === 1) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = wrongContestants.map(p => p.name);
      } else {
        winnerNames = [];
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = contestants.map(p => p.name);
      }
    } else if (winnerCount === 0 && contestants.length === 4) {
      // Classic Top 4 survival mode case (Case A)
      if (correctContestants.length === 4) {
        const slowest = correctContestantsSortedByTimeAsc[3];
        eliminatedNames = [slowest.name];
        winnerNames = correctContestantsSortedByTimeAsc.slice(0, 3).map(p => p.name);
        newPhase = "finished";
        newSurvivalContestants = [];
      } else if (correctContestants.length === 3) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = wrongContestants.map(p => p.name);
        newPhase = "finished";
        newSurvivalContestants = [];
      } else if (correctContestants.length === 2) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = wrongContestants.map(p => p.name);
      } else if (correctContestants.length === 1) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = wrongContestants.map(p => p.name);
      } else {
        winnerNames = [];
        eliminatedNames = [];
        newPhase = "reveal";
        newSurvivalContestants = contestants.map(p => p.name);
      }
    } else {
      // General cases: Section 10
      if (correctContestants.length === 0) {
        winnerNames = [];
        eliminatedNames = [];
        newPhase = "reveal";
      } else if (correctContestants.length < slotsRemaining) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = wrongContestants.map(p => p.name);
        newPhase = "reveal";
        newSurvivalContestants = [];
      } else if (correctContestants.length === slotsRemaining) {
        winnerNames = correctContestants.map(p => p.name);
        eliminatedNames = wrongContestants.map(p => p.name);
        newPhase = "finished";
        newSurvivalContestants = [];
      } else {
        const winners = correctContestantsSortedByTimeAsc.slice(0, slotsRemaining);
        winnerNames = winners.map(p => p.name);
        eliminatedNames = wrongContestants.map(p => p.name);
        newPhase = "finished";
        newSurvivalContestants = [];
      }
    }
  }

  // Apply DB updates
  playersList.forEach(p => {
    const sanitized = sanitizeKey(p.name);
    
    let newStatus = p.status;
    let lastResult: "correct" | "wrong" | "no_answer" = "no_answer";
    let lastAction: "waiting" | "survived" | "eliminated" | "resurrected" | "winner_locked" = "waiting";

    if (p.answer === null) {
      lastResult = "no_answer";
    } else if (p.answer === correctAnswer) {
      lastResult = "correct";
    } else {
      lastResult = "wrong";
    }

    if (p.status === "winner") {
      newStatus = "winner";
      lastAction = "winner_locked";
      lastResult = "correct";
    } else if (winnerNames.includes(p.name)) {
      newStatus = "winner";
      lastAction = "winner_locked";
    } else if (eliminatedNames.includes(p.name)) {
      newStatus = "dead";
      lastAction = "eliminated";
    } else if (resurrectedNames.includes(p.name)) {
      newStatus = "alive";
      lastAction = "resurrected";
    } else if (p.status === "alive") {
      if (newPhase === "finished") {
        newStatus = "dead";
        lastAction = "eliminated";
      } else {
        newStatus = "alive";
        lastAction = "survived";
      }
    } else {
      newStatus = "dead";
      lastAction = "waiting";
    }

    dbUpdates[`players/${sanitized}/status`] = newStatus;
    dbUpdates[`players/${sanitized}/lastResult`] = lastResult;
    dbUpdates[`players/${sanitized}/lastAction`] = lastAction;
  });

  if (Object.keys(dbUpdates).length > 0) {
    await update(ref(db), dbUpdates);
  }

  const updatedWinnerCount = playersList.filter(p => dbUpdates[`players/${sanitizeKey(p.name)}/status`] === "winner").length;
  const winnerSlotsRemaining = 3 - updatedWinnerCount;

  await update(stateRef, {
    phase: newPhase,
    mode: newMode,
    resurrectionCount: newResurrectionCount,
    onlyOneWinnerPerQuestion: newOnlyOneWinnerPerQuestion,
    survivalContestants: newSurvivalContestants,
    eliminatedThisRound: eliminatedNames.length > 0 ? eliminatedNames : null,
    resurrectedThisRound: resurrectedNames.length > 0 ? resurrectedNames : null,
    winnersThisRound: winnerNames.length > 0 ? winnerNames : null,
    winnerSlotsRemaining
  });
}

// Advance to next question
export async function nextQuestion(difficulty: "easy" | "medium" | "hard" = "easy") {
  const stateRef = ref(db, "gameState");
  const stateSnap = await get(stateRef);
  if (!stateSnap.exists()) return;

  const state: GameState = stateSnap.val();
  
  const playersRef = ref(db, "players");
  const playersSnap = await get(playersRef);
  const players: Record<string, Player> = playersSnap.exists() ? playersSnap.val() : {};
  const playersList = Object.values(players);
  const winnerCount = playersList.filter(p => p.status === "winner").length;
  
  if (winnerCount >= 3) {
    await update(stateRef, {
      phase: "finished" as GamePhase
    });
    return;
  }

  const usedIds: Record<string, boolean> = state.usedQuestionIds || {};
  const usedCount = Object.keys(usedIds).length;

  if (usedCount >= questions.length) {
    await update(stateRef, {
      phase: "finished" as GamePhase
    });
    return;
  }

  let availableQuestions = questions.filter(q => q.difficulty === difficulty && !usedIds[q.id]);
  if (availableQuestions.length === 0) {
    availableQuestions = questions.filter(q => !usedIds[q.id]);
  }

  if (availableQuestions.length === 0) {
    await update(stateRef, {
      phase: "finished" as GamePhase
    });
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const nextQuestionObj = availableQuestions[randomIndex];

  const updatedUsedIds = { ...usedIds, [nextQuestionObj.id]: true };
  const nextRound = state.currentQuestion + 1;

  const aliveCount = playersList.filter(p => p.status === "alive").length;
  
  let newMode: GameMode = state.mode || "normal";
  let newResurrectionCount = state.resurrectionCount;
  let survivalContestants = state.survivalContestants || null;

  if (state.mode === "survival") {
    newMode = "survival";
    newResurrectionCount = 0;
    if (!survivalContestants) {
      survivalContestants = playersList.filter(p => p.status === "alive").map(p => p.name);
    }
  } else {
    if (aliveCount <= 5) {
      newMode = "survival";
      newResurrectionCount = 0;
      survivalContestants = playersList.filter(p => p.status === "alive").map(p => p.name);
    } else {
      newMode = "normal";
      survivalContestants = null;
    }
  }

  if (nextRound > questions.length) {
    await update(stateRef, {
      phase: "finished" as GamePhase
    });
  } else {
    await update(stateRef, {
      phase: "question" as GamePhase,
      mode: newMode,
      currentQuestion: nextRound,
      activeQuestionId: nextQuestionObj.id,
      resurrectionCount: newResurrectionCount,
      eliminatedThisRound: null,
      resurrectedThisRound: null,
      winnersThisRound: null,
      questionStartTime: serverTimestamp(),
      usedQuestionIds: updatedUsedIds,
      survivalContestants: survivalContestants
    });
    await resetAllAnswers();
  }
}

