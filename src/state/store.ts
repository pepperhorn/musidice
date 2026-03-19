import { create } from 'zustand';
import type { AccidentalMode, DicePairResult, RollingPhase } from '../types';

interface DiceState {
  started: boolean;
  accidentalMode: AccidentalMode;
  pairCount: number;
  rollingPhase: RollingPhase;
  currentPairIndex: number;
  results: DicePairResult[];

  setStarted: (v: boolean) => void;
  setAccidentalMode: (mode: AccidentalMode) => void;
  setPairCount: (n: number) => void;
  setRollingPhase: (phase: RollingPhase) => void;
  setCurrentPairIndex: (i: number) => void;
  setResults: (r: DicePairResult[]) => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  started: false,
  accidentalMode: 'flat',
  pairCount: 1,
  rollingPhase: 'idle',
  currentPairIndex: 0,
  results: [],

  setStarted: (v) => set({ started: v }),
  setAccidentalMode: (mode) => set({ accidentalMode: mode }),
  setPairCount: (n) => set({ pairCount: n }),
  setRollingPhase: (phase) => set({ rollingPhase: phase }),
  setCurrentPairIndex: (i) => set({ currentPairIndex: i }),
  setResults: (r) => set({ results: r }),
}));
