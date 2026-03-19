import { useDiceStore } from '../state/store';

export function Toolbar() {
  const pairCount = useDiceStore((s) => s.pairCount);
  const setPairCount = useDiceStore((s) => s.setPairCount);
  const accidentalMode = useDiceStore((s) => s.accidentalMode);
  const setAccidentalMode = useDiceStore((s) => s.setAccidentalMode);
  const rollingPhase = useDiceStore((s) => s.rollingPhase);
  const isRolling = rollingPhase !== 'idle';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 px-4 py-3 flex items-center justify-center gap-6 font-[Poppins] z-40">
      {/* Pair count */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm mr-1">Pairs:</span>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setPairCount(n)}
            disabled={isRolling}
            className={`w-8 h-8 rounded-full text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
              pairCount === n
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Sharp/flat toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAccidentalMode('flat')}
          disabled={isRolling}
          className={`px-3 py-1 rounded-l-full text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
            accidentalMode === 'flat'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          &#9837;
        </button>
        <button
          onClick={() => setAccidentalMode('sharp')}
          disabled={isRolling}
          className={`px-3 py-1 rounded-r-full text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
            accidentalMode === 'sharp'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          &#9839;
        </button>
      </div>
    </div>
  );
}
