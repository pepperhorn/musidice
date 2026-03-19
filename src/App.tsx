import { useDiceStore } from './state/store';
import { Overlay } from './components/Overlay';
import { DiceArea } from './components/DiceArea';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const started = useDiceStore((s) => s.started);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-[Poppins] bg-gray-900">
      {started ? (
        <>
          <DiceArea />
          <Toolbar />
        </>
      ) : (
        <Overlay />
      )}
    </div>
  );
}
