import { useDiceStore } from '../state/store';
import { useRollAnimation } from '../hooks/useRollAnimation';
import type { AccidentalMode } from '../types';

const ACCIDENTAL_CYCLE: AccidentalMode[] = ['off', 'flat', 'natural', 'sharp'];
const ACCIDENTAL_LABELS: Record<AccidentalMode, string> = {
  off: '?',
  flat: '♭',
  natural: '♮',
  sharp: '♯',
};

export function Toolbar() {
  const mode = useDiceStore((s) => s.mode);
  const setMode = useDiceStore((s) => s.setMode);
  const pairCount = useDiceStore((s) => s.pairCount);
  const setPairCount = useDiceStore((s) => s.setPairCount);
  const chordCount = useDiceStore((s) => s.chordCount);
  const setChordCount = useDiceStore((s) => s.setChordCount);
  const partials = useDiceStore((s) => s.partials);
  const setPartials = useDiceStore((s) => s.setPartials);
  const accidentalMode = useDiceStore((s) => s.accidentalMode);
  const setAccidentalMode = useDiceStore((s) => s.setAccidentalMode);
  const chordRootMode = useDiceStore((s) => s.chordRootMode);
  const setChordRootMode = useDiceStore((s) => s.setChordRootMode);
  const results = useDiceStore((s) => s.results);
  const chordResults = useDiceStore((s) => s.chordResults);
  const { shuffle, invert, isRolling } = useRollAnimation();

  const hasNoteResults = results.length > 0 && results.every((r) => r.die1.landed && r.die2.landed);
  const hasChordResults = chordResults.length > 0 && chordResults.every((c) => c.dice.every((d) => d.landed));
  const hasResults = mode === 'chords' ? hasChordResults : hasNoteResults;

  const count = mode === 'chords' ? chordCount : pairCount;
  const setCount = mode === 'chords' ? setChordCount : setPairCount;

  const btnBase = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200';
  const toggleBtn = 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed border bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-400';
  const actionBtn = 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-base font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 hover:text-slate-800';
  const labelClass = 'text-slate-500 text-xs sm:text-base';
  const valueClass = 'text-slate-700 text-xs sm:text-base font-semibold w-5 sm:w-7 text-center';
  const sepClass = 'w-px h-5 sm:h-7 bg-slate-200';

  // Cycle accidental mode on click
  const cycleAccidental = () => {
    const idx = ACCIDENTAL_CYCLE.indexOf(accidentalMode);
    setAccidentalMode(ACCIDENTAL_CYCLE[(idx + 1) % ACCIDENTAL_CYCLE.length]);
  };

  // Toggle chord root mode
  const toggleChordRoot = () => {
    setChordRootMode(chordRootMode === 'simple' ? 'all' : 'simple');
  };

  // Toggle game mode
  const toggleMode = () => {
    setMode(mode === 'notes' ? 'chords' : 'notes');
  };

  return (
    <div className="toolbar fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 px-2 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 font-[Poppins] z-40">
      {/* Row 1: count, partials, accidental/root */}
      <div className="toolbar-row-settings flex items-center gap-1.5 sm:gap-3">
        {/* Count +/- */}
        <div className="toolbar-count flex items-center gap-1 sm:gap-2">
          <span className={`toolbar-count-label ${labelClass}`}>{mode === 'chords' ? 'Chords:' : 'Pairs:'}</span>
          <button
            onClick={() => setCount(Math.max(1, count - 1))}
            disabled={isRolling || count <= 1}
            className={`btn-count-minus ${btnBase}`}
          >
            &minus;
          </button>
          <span className={`toolbar-count-value ${valueClass}`}>{count}</span>
          <button
            onClick={() => setCount(count + 1)}
            disabled={isRolling}
            className={`btn-count-plus ${btnBase}`}
          >
            +
          </button>
        </div>

        {/* Partials (chords mode only) */}
        {mode === 'chords' && (
          <>
            <div className={`toolbar-separator ${sepClass}`} />
            <div className="toolbar-partials flex items-center gap-1 sm:gap-2">
              <span className={`toolbar-partials-label ${labelClass}`}>Ext:</span>
              <button
                onClick={() => setPartials(partials - 1)}
                disabled={isRolling || partials <= 0}
                className={`btn-partials-minus ${btnBase}`}
              >
                &minus;
              </button>
              <span className={`toolbar-partials-value ${valueClass}`}>{partials}</span>
              <button
                onClick={() => setPartials(partials + 1)}
                disabled={isRolling || partials >= 5}
                className={`btn-partials-plus ${btnBase}`}
              >
                +
              </button>
            </div>
          </>
        )}

        <div className={`toolbar-separator ${sepClass}`} />

        {/* Accidental toggle (notes mode) / Root mode toggle (chords mode) */}
        {mode === 'notes' ? (
          <button
            onClick={cycleAccidental}
            disabled={isRolling}
            className={`btn-accidental-toggle ${accidentalMode === 'off' ? actionBtn : toggleBtn}`}
            title={`Accidental: ${accidentalMode}`}
          >
            {ACCIDENTAL_LABELS[accidentalMode]}
          </button>
        ) : (
          <button
            onClick={toggleChordRoot}
            disabled={isRolling}
            className={`btn-chord-root-toggle ${toggleBtn}`}
            title={`Root mode: ${chordRootMode}`}
          >
            {chordRootMode === 'simple' ? 'Simple' : 'All'}
          </button>
        )}
      </div>

      {/* Row 2: actions */}
      <div className="toolbar-row-actions flex items-center gap-1.5 sm:gap-3">
        {/* Invert (chords mode only) */}
        {mode === 'chords' && (
          <button
            onClick={invert}
            disabled={!hasResults || isRolling}
            className={`btn-invert ${actionBtn}`}
          >
            Inv
          </button>
        )}

        {/* Shuffle */}
        <button
          onClick={shuffle}
          disabled={!hasResults || isRolling}
          className={`btn-shuffle ${actionBtn}`}
        >
          Shuffle
        </button>

        {/* Mode toggle — single button that cycles */}
        <button
          onClick={toggleMode}
          disabled={isRolling}
          className={`btn-mode-toggle ${toggleBtn}`}
        >
          {mode === 'notes' ? 'Notes' : 'Chords'}
        </button>
      </div>
    </div>
  );
}
