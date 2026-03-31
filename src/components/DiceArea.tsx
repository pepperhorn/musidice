import { useEffect, useMemo, useRef, useState } from 'react';
import { useDiceStore } from '../state/store';
import { playArpeggio } from '../audio/engine';
import { DicePair } from './DicePair';
import { ChordGroup } from './ChordGroup';

/** Calculate the pixel width of a group given dice count */
function groupWidth(diceCount: number, diceSize: number, diceGap: number): number {
  return diceCount * diceSize + Math.max(0, diceCount - 1) * diceGap;
}

export function DiceArea() {
  const mode = useDiceStore((s) => s.mode);
  const pairCount = useDiceStore((s) => s.pairCount);
  const chordCount = useDiceStore((s) => s.chordCount);
  const rollingPhase = useDiceStore((s) => s.rollingPhase);
  const results = useDiceStore((s) => s.results);
  const chordResults = useDiceStore((s) => s.chordResults);
  const isRolling = rollingPhase !== 'idle';

  const totalItems = mode === 'chords' ? chordCount : pairCount;

  // Fade transition on mode switch
  const [fading, setFading] = useState(false);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setFading(true);
      setCurrentPage(0);
      const t = setTimeout(() => setFading(false), 300);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Measure available dimensions
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(1200);
  const [isPortrait, setIsPortrait] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (areaRef.current) {
        const w = areaRef.current.clientWidth - 32;
        setAreaWidth(w);
        setIsPortrait(w < 600); // portrait/narrow viewport
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (areaRef.current) observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, []);

  // Greedy page assignment
  const pages = useMemo(() => {
    const diceSize = 128; // sm:w-32
    const diceGap = mode === 'chords' ? 12 : 16;
    const groupGap = 24;

    // Portrait chord mode: 1 chord per page (dice wrap within the chord group)
    if (isPortrait && mode === 'chords') {
      return Array.from({ length: totalItems }, (_, i) => [i]);
    }

    // Landscape / notes mode: pack groups into single-row pages
    const result: number[][] = [[]];
    let currentRowWidth = 0;

    for (let i = 0; i < totalItems; i++) {
      let diceCount: number;
      if (mode === 'chords') {
        diceCount = chordResults[i]?.dice.length ?? 3;
      } else {
        diceCount = 2;
      }

      const gw = groupWidth(diceCount, diceSize, diceGap);
      const widthWithGap = currentRowWidth > 0 ? gw + groupGap : gw;

      if (currentRowWidth + widthWithGap > areaWidth && result[result.length - 1].length > 0) {
        result.push([i]);
        currentRowWidth = gw;
      } else {
        result[result.length - 1].push(i);
        currentRowWidth += widthWithGap;
      }
    }

    return result;
  }, [totalItems, areaWidth, mode, chordResults, isPortrait]);

  const totalPages = pages.length;
  const needsPagination = totalPages > 1;

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const goToPage = (page: number) => {
    if (page === currentPage || page < 0 || page >= totalPages) return;
    setSlideDir(page > currentPage ? 'left' : 'right');
    setCurrentPage(page);
    setTimeout(() => setSlideDir(null), 400);

    if (mode === 'chords') {
      let delay = 400;
      for (const idx of pages[page]) {
        const chord = chordResults[idx];
        if (chord && chord.dice.every((d) => d.landed)) {
          setTimeout(() => {
            const notes = chord.dice.map((d) => ({ note: d.note, octave: d.octave }));
            playArpeggio(notes);
          }, delay);
          delay += 500;
        }
      }
    }
  };

  const currentPageItems = pages[currentPage] ?? [];

  const slideClass = slideDir === 'left'
    ? 'animate-slide-in-left'
    : slideDir === 'right'
      ? 'animate-slide-in-right'
      : '';

  return (
    <div ref={areaRef} className="dice-area flex-1 flex flex-col items-center justify-center gap-2 pb-16 overflow-hidden">
      {/* Dice grid */}
      <div
        key={`${mode}-${currentPage}`}
        className={`dice-grid flex flex-wrap items-end justify-center gap-6 ${slideClass}`}
        style={{
          opacity: fading ? 0 : 1,
          transition: fading ? 'opacity 0.3s ease-in-out' : undefined,
        }}
      >
        {mode === 'chords'
          ? currentPageItems.map((idx) => (
              <ChordGroup
                key={idx}
                result={chordResults[idx] ?? null}
                rollingPhase={rollingPhase}
                groupIndex={idx}
                compact={isPortrait}
              />
            ))
          : currentPageItems.map((idx) => (
              <DicePair
                key={idx}
                result={results[idx] ?? null}
                rollingPhase={rollingPhase}
              />
            ))
        }
      </div>

      {/* Composerating indicator — always reserves space */}
      <p className={`composerating-label text-slate-400 text-lg font-[Poppins] pt-5 ${isRolling ? 'animate-typewriter' : 'invisible'}`}>
        Composerating...
      </p>

      {/* Pagination */}
      {needsPagination && (
        <div className="dice-pagination flex items-center gap-2 flex-wrap justify-center">
          {pages.map((pageItems, i) => {
            // Build label: chord names for chord mode, page number for notes
            let label = `${i + 1}`;
            if (mode === 'chords') {
              const names = pageItems
                .map((idx) => chordResults[idx]?.label)
                .filter(Boolean);
              if (names.length > 0) label = names.join(', ');
            }
            return (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={`pagination-item px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer border ${
                  i === currentPage
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
