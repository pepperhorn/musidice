import { useDiceStore } from '../state/store';
import { initAudio } from '../audio/engine';

export function Overlay() {
  const setStarted = useDiceStore((s) => s.setStarted);

  const handleStart = async () => {
    await initAudio();
    setStarted(true);
  };

  return (
    <div className="overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white/90 via-white/80 to-emerald-50/60 backdrop-blur-md">
      <h1 className="overlay-title overlay-enter text-6xl sm:text-7xl text-slate-800 mb-1 font-[Knewave] drop-shadow-[0_2px_12px_rgba(16,185,129,0.2)]">
        RollaNote
      </h1>
      <p className="overlay-subtitle overlay-enter-delay-1 text-slate-400 mb-10 text-lg font-[Caveat] tracking-wide">
        Roll the dice to find your musical inspiration!
      </p>
      <button
        onClick={handleStart}
        className="btn-start overlay-enter-delay-2 px-10 py-4 rounded-full bg-emerald-500 text-white text-xl font-semibold shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400 hover:shadow-[0_6px_32px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-[Poppins]"
      >
        Get Shakin'!
      </button>
    </div>
  );
}
