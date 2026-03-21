interface GoButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function GoButton({ onClick, disabled }: GoButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-8 px-12 py-3 rounded-full bg-emerald-500 text-white text-lg font-semibold shadow-lg hover:bg-emerald-600 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100 font-[Poppins] ${disabled ? 'animate-pulse-glow disabled:opacity-70' : ''}`}
    >
      {disabled ? 'Rolling...' : 'Go'}
    </button>
  );
}
