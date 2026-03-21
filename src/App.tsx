import { useDiceStore } from './state/store';
import { Overlay } from './components/Overlay';
import { DiceArea } from './components/DiceArea';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const started = useDiceStore((s) => s.started);

  return (
    <div className="w-full h-dvh overflow-hidden font-[Poppins] bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <h1 className="text-center text-slate-300 text-5xl font-[Knewave] pt-4">MusiDice</h1>
      <DiceArea />
      <Toolbar />
      {!started && <Overlay />}
    </div>
  );
}
