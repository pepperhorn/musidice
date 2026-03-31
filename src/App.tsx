import { useRef } from 'react';
import { useDiceStore } from './state/store';
import { useRollAnimation } from './hooks/useRollAnimation';
import { Overlay } from './components/Overlay';
import { DiceArea } from './components/DiceArea';
import { Toolbar } from './components/Toolbar';

const NUDGE_CLASSES = ['animate-nudge-1', 'animate-nudge-2'];

export default function App() {
  const started = useDiceStore((s) => s.started);
  const { roll, isRolling } = useRollAnimation();
  const nudgeRef = useRef(NUDGE_CLASSES[Math.floor(Math.random() * NUDGE_CLASSES.length)]);

  // Swap nudge variant each time rolling finishes
  const prevRollingRef = useRef(false);
  if (prevRollingRef.current && !isRolling) {
    nudgeRef.current = NUDGE_CLASSES[Math.floor(Math.random() * NUDGE_CLASSES.length)];
  }
  prevRollingRef.current = isRolling;

  return (
    <div className="app-container app-bg w-full h-dvh overflow-hidden flex flex-col relative" style={{ fontFamily: "'Poppins', 'Noto Music', sans-serif" }}>
      <button
        onClick={roll}
        disabled={isRolling}
        className={`app-title-btn relative z-10 text-center text-5xl font-[Knewave] pt-4 pb-2 cursor-pointer transition-all duration-300 active:scale-95 disabled:cursor-default shrink-0 ${isRolling ? '' : nudgeRef.current}`}
        style={{ background: 'none', border: 'none' }}
      >
        {isRolling ? (
          <span className="app-title-rolling text-slate-300 transition-colors duration-300">RollaNote</span>
        ) : (
          <span className="app-title-ready text-emerald-500 drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all duration-300">Get Shakin'!</span>
        )}
      </button>
      <DiceArea />
      <Toolbar />
      {!started && <Overlay />}
    </div>
  );
}
