interface GoButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function GoButton({ onClick, disabled }: GoButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-go mt-8 px-12 py-3 rounded-full bg-emerald-500 text-white text-lg font-semibold shadow-md hover:bg-emerald-400 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100 font-[Poppins] ${disabled ? 'animate-pulse-glow disabled:opacity-70' : ''}`}
    >
      {disabled ? 'Composerating...' : 'Go'}
    </button>
  );
}
