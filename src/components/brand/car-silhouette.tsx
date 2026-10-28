import { cn } from "../ui/cn";

/** Silhouette vectorielle (dessinée pour CarView) utilisée quand aucune photo n'est disponible. */
export function CarSilhouette({ className, accent = false }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="0 0 400 130" className={cn("h-auto w-full", className)} role="img" aria-label="Silhouette de véhicule (illustration)">
      <defs>
        <linearGradient id="cv-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a4f57" />
          <stop offset="1" stopColor="#1d2024" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="116" rx="180" ry="7" fill="#000" opacity="0.5" />
      <path
        d="M18 96 L16 84 Q18 76 40 72 L128 64 Q150 50 182 40 Q220 34 258 38 Q296 46 326 62 L372 68 Q384 72 384 84 L382 96 L336 96 A31 31 0 0 0 274 96 L118 96 A31 31 0 0 0 56 96 Z"
        fill="url(#cv-body)"
        stroke="#5a606a"
        strokeWidth="1"
      />
      <path d="M142 63 Q162 50 186 44 L250 42 Q280 48 298 61 Z" fill="#0e0f11" opacity="0.85" />
      <path d="M222 43 L220 62" stroke="#3a3f46" strokeWidth="3" />
      <path d="M20 80 L44 78" stroke={accent ? "#ff6a5f" : "#d9d9d9"} strokeWidth="3" strokeLinecap="round" />
      <path d="M370 74 L382 76" stroke="#d9261c" strokeWidth="4" strokeLinecap="round" />
      {[87, 305].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="98" r="25" fill="#0b0c0e" />
          <circle cx={cx} cy="98" r="15" fill="none" stroke="#6b717a" strokeWidth="3" />
          <circle cx={cx} cy="98" r="4" fill="#6b717a" />
        </g>
      ))}
    </svg>
  );
}
