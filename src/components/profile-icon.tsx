/**
 * Roll form profil kesitleri — gerçek çelik profil kesiti gibi kalın hatlı,
 * hafif dolgulu teknik çizim ikonları. currentColor ile temaya uyumlu.
 */

type Shape = { d: string; fill?: boolean };

const shapes: Record<string, Shape> = {
  // Kablo kanalı — U kesit
  kablo: { d: "M9 13 V33 H33 V13", fill: false },
  // Solar — şapka (omega) profil
  solar: { d: "M5 33 H14 L14 17 H28 L28 33 H37 M14 17 L11 13 M28 17 L31 13", fill: false },
  // Ağır raf — dönüşlü C profil
  raf: { d: "M31 9 H13 V33 H31 M13 21 H24", fill: false },
  // İskele kalas — oluklu platform
  iskele: { d: "M5 27 H9 V19 H14 V27 H19 V19 H24 V27 H29 V19 H34 V27 H37 M5 27 V33 H37 V27", fill: false },
  // Yol bariyeri — W profil (iki dalga)
  bariyer: { d: "M5 15 C 11 15 11 24 17 24 S 23 15 29 15 34 24 39 24 M5 24 C 11 24 11 33 17 33", fill: false },
  // Gürültü bariyeri — kaset kesiti
  gurultu: { d: "M7 11 H31 L37 16 V33 H7 Z M14 17 V29 M22 17 V29 M30 17 V29", fill: false },
  // C+/Sigma/Omega — sigma profil
  csigma: { d: "M31 11 H15 L27 21 L15 31 H31", fill: false },
};

export function ProfileIcon({
  k,
  className = "size-10 text-muted",
}: {
  k?: string;
  className?: string;
}) {
  const shape = k ? shapes[k] : undefined;
  if (!shape) return null;
  return (
    <svg
      viewBox="0 0 42 42"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={shape.d} />
    </svg>
  );
}
