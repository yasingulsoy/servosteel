/**
 * Ana çözüm kartları için iki tonlu (duotone) endüstriyel ikonlar.
 * currentColor = ana çizgi; accent dolgu vurgusu sabit altın.
 */

export function SolutionIcon({
  name,
  className = "size-14",
}: {
  name: "rollform" | "slitting" | "ctl";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 56 56",
    fill: "none",
    "aria-hidden": true as const,
  };

  if (name === "rollform") {
    // Üç merdane arasından şekillenen sac
    return (
      <svg {...common}>
        <path d="M4 20 H52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <path d="M4 36 C 16 36 16 28 28 28 S 40 20 52 20" stroke="#e7a300" strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="30" r="7" fill="#e7a300" opacity="0.18" />
        <circle cx="12" cy="30" r="7" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="34" r="7" fill="#e7a300" opacity="0.18" />
        <circle cx="28" cy="34" r="7" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="30" r="7" fill="#e7a300" opacity="0.18" />
        <circle cx="44" cy="30" r="7" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );
  }

  if (name === "slitting") {
    // Rulodan çıkan, dilinen şeritler
    return (
      <svg {...common}>
        <circle cx="17" cy="28" r="13" fill="#e7a300" opacity="0.15" />
        <circle cx="17" cy="28" r="13" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="17" cy="28" r="4" stroke="#e7a300" strokeWidth="2.5" />
        <path d="M30 22 H50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 28 H50" stroke="#e7a300" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 34 H50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 15 V41" stroke="#e7a300" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }

  // ctl — giyotin ile plakaya kesim
  return (
    <svg {...common}>
      <rect x="6" y="30" width="20" height="9" rx="1.5" fill="#e7a300" opacity="0.15" />
      <rect x="6" y="30" width="20" height="9" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="30" y="30" width="20" height="9" rx="1.5" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
      <path d="M28 12 V44" stroke="#e7a300" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 18 L34 12 L34 20 Z" fill="#e7a300" />
    </svg>
  );
}
