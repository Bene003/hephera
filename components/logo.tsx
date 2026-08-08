export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="Hephera"
    >
      <defs>
        <linearGradient id="hephera-molten" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc078" />
          <stop offset="50%" stopColor="#ff7a18" />
          <stop offset="100%" stopColor="#b83c14" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="11"
        fill="#101017"
        stroke="rgba(255,157,66,0.35)"
        strokeWidth="1.5"
      />
      <g fill="url(#hephera-molten)">
        <rect x="11" y="9" width="4.6" height="22" rx="1.4" />
        <rect x="24.4" y="9" width="4.6" height="22" rx="1.4" />
        <rect x="11" y="17.7" width="18" height="4.6" rx="1.4" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[1.05rem] font-semibold tracking-[0.22em] text-bone-50 uppercase ${className}`}
    >
      Hephera
    </span>
  );
}
