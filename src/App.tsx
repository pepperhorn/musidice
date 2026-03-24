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
    <div className="app-container w-full h-dvh overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col" style={{ fontFamily: "'Poppins', 'Noto Music', sans-serif" }}>
      <button
        onClick={roll}
        disabled={isRolling}
        className={`app-title-btn text-center text-5xl font-[Knewave] pt-4 pb-2 cursor-pointer transition-all active:scale-95 disabled:cursor-default shrink-0 ${isRolling ? '' : nudgeRef.current}`}
        style={{ background: 'none', border: 'none' }}
      >
        {isRolling ? (
          <span className="text-slate-300">MusiDice</span>
        ) : (
          <span className="text-emerald-500">Get Shakin'!</span>
        )}
      </button>
      <DiceArea />
      <Toolbar />
      {!started && <Overlay />}
    </div>
  );
}
