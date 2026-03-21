import { useDiceStore } from '../state/store';
import { useRollAnimation } from '../hooks/useRollAnimation';

export function Toolbar() {
  const pairCount = useDiceStore((s) => s.pairCount);
  const setPairCount = useDiceStore((s) => s.setPairCount);
  const accidentalMode = useDiceStore((s) => s.accidentalMode);
  const setAccidentalMode = useDiceStore((s) => s.setAccidentalMode);
  const results = useDiceStore((s) => s.results);
  const { shuffle, isRolling } = useRollAnimation();
  const hasResults = results.length > 0 && results.every((r) => r.die1.landed && r.die2.landed);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 px-4 py-3 flex items-center justify-center gap-6 font-[Poppins] z-40">
      {/* Pair count +/- */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-base mr-1">Pairs:</span>
        <button
          onClick={() => setPairCount(Math.max(1, pairCount - 1))}
          disabled={isRolling || pairCount <= 1}
          className="w-10 h-10 rounded-full text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
        >
          &minus;
        </button>
        <span className="text-slate-700 text-base font-semibold w-7 text-center">{pairCount}</span>
        <button
          onClick={() => setPairCount(pairCount + 1)}
          disabled={isRolling}
          className="w-10 h-10 rounded-full text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
        >
          +
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-7 bg-slate-200" />

      {/* Natural/flat/sharp toggle */}
      <div className="flex items-center">
        <button
          onClick={() => setAccidentalMode('flat')}
          disabled={isRolling}
          className={`px-3.5 py-1.5 rounded-l-full text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed border ${
            accidentalMode === 'flat'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
          }`}
        >
          &#9837;
        </button>
        <button
          onClick={() => setAccidentalMode('natural')}
          disabled={isRolling}
          className={`px-3.5 py-1.5 text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed border-y ${
            accidentalMode === 'natural'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
          }`}
        >
          &#9838;
        </button>
        <button
          onClick={() => setAccidentalMode('sharp')}
          disabled={isRolling}
          className={`px-3.5 py-1.5 rounded-r-full text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed border ${
            accidentalMode === 'sharp'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
          }`}
        >
          &#9839;
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-7 bg-slate-200" />

      {/* Shuffle */}
      <button
        onClick={shuffle}
        disabled={!hasResults || isRolling}
        className="px-5 py-2 rounded-full text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 hover:text-slate-800"
      >
        Shuffle
      </button>
    </div>
  );
}
