import { create } from 'zustand';
import type { AccidentalMode, ChordGroupResult, ChordRootMode, DicePairResult, GameMode, RollingPhase } from '../types';

interface DiceState {
  started: boolean;
  mode: GameMode;
  accidentalMode: AccidentalMode;
  pairCount: number;
  chordCount: number;
  partials: number;
  chordRootMode: ChordRootMode;
  rollingPhase: RollingPhase;
  currentPairIndex: number;
  results: DicePairResult[];
  chordResults: ChordGroupResult[];
  shuffling: boolean;

  setStarted: (v: boolean) => void;
  setMode: (mode: GameMode) => void;
  setAccidentalMode: (mode: AccidentalMode) => void;
  setPairCount: (n: number) => void;
  setChordCount: (n: number) => void;
  setPartials: (n: number) => void;
  setChordRootMode: (mode: ChordRootMode) => void;
  setRollingPhase: (phase: RollingPhase) => void;
  setCurrentPairIndex: (i: number) => void;
  setResults: (r: DicePairResult[]) => void;
  setChordResults: (r: ChordGroupResult[]) => void;
  setShuffling: (v: boolean) => void;
  shuffleResults: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  started: false,
  mode: 'notes',
  accidentalMode: 'off',
  pairCount: 1,
  chordCount: 1,
  partials: 0,
  chordRootMode: 'all',
  rollingPhase: 'idle',
  currentPairIndex: 0,
  results: [],
  chordResults: [],
  shuffling: false,

  setStarted: (v) => set({ started: v }),
  setMode: (mode) => set({ mode }),
  setAccidentalMode: (mode) => set({ accidentalMode: mode }),
  setPairCount: (n) => set({ pairCount: n }),
  setChordCount: (n) => set({ chordCount: n }),
  setPartials: (n) => set({ partials: Math.max(0, Math.min(5, n)) }),
  setChordRootMode: (mode) => set({ chordRootMode: mode }),
  setRollingPhase: (phase) => set({ rollingPhase: phase }),
  setCurrentPairIndex: (i) => set({ currentPairIndex: i }),
  setResults: (r) => set({ results: r }),
  setChordResults: (r) => set({ chordResults: r }),
  setShuffling: (v) => set({ shuffling: v }),
  shuffleResults: () => set((state) => {
    const allDice = state.results.flatMap((r) => [r.die1, r.die2]);
    for (let i = allDice.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDice[i], allDice[j]] = [allDice[j], allDice[i]];
    }
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
