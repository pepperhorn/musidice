import { create } from 'zustand';
import type { AccidentalMode, DicePairResult, RollingPhase } from '../types';

interface DiceState {
  started: boolean;
  accidentalMode: AccidentalMode;
  pairCount: number;
  rollingPhase: RollingPhase;
  currentPairIndex: number;
  results: DicePairResult[];
  shuffling: boolean;

  setStarted: (v: boolean) => void;
  setAccidentalMode: (mode: AccidentalMode) => void;
  setPairCount: (n: number) => void;
  setRollingPhase: (phase: RollingPhase) => void;
  setCurrentPairIndex: (i: number) => void;
  setResults: (r: DicePairResult[]) => void;
  setShuffling: (v: boolean) => void;
  shuffleResults: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  started: false,
  accidentalMode: 'flat',
  pairCount: 1,
  rollingPhase: 'idle',
  currentPairIndex: 0,
  results: [],
  shuffling: false,

  setStarted: (v) => set({ started: v }),
  setAccidentalMode: (mode) => set({ accidentalMode: mode }),
  setPairCount: (n) => set({ pairCount: n }),
  setRollingPhase: (phase) => set({ rollingPhase: phase }),
  setCurrentPairIndex: (i) => set({ currentPairIndex: i }),
  setResults: (r) => set({ results: r }),
  setShuffling: (v) => set({ shuffling: v }),
  shuffleResults: () => set((state) => {
    // Flatten all dice into a single array, then Fisher-Yates shuffle
    const allDice = state.results.flatMap((r) => [r.die1, r.die2]);
    for (let i = allDice.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDice[i], allDice[j]] = [allDice[j], allDice[i]];
    }
    // Re-pair them
    const results: DicePairResult[] = [];
    for (let i = 0; i < allDice.length; i += 2) {
      results.push({
        die1: { ...allDice[i], landed: true },
        die2: { ...allDice[i + 1], landed: true },
      });
    }
    return { results };
  }),
}));
