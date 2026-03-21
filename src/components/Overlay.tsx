import { useDiceStore } from '../state/store';
import { initAudio } from '../audio/engine';

export function Overlay() {
  const setStarted = useDiceStore((s) => s.setStarted);

  const handleStart = async () => {
    await initAudio();
    setStarted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <h1 className="text-5xl font-bold text-slate-800 mb-2 font-[Poppins]">Musidice</h1>
      <p className="text-slate-500 mb-8 font-[Poppins]">A musical dice game</p>
      <button
        onClick={handleStart}
        className="px-10 py-4 rounded-full bg-emerald-500 text-white text-xl font-semibold shadow-lg hover:bg-emerald-400 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer font-[Poppins]"
      >
        Get Shakin'!
      </button>
    </div>
  );
}
