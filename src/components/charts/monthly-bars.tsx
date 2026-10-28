"use client";

import { useState } from "react";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

function niceMax(v: number) {
  if (v <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

/** Histogramme mensuel (une seule série) avec info-bulle au survol et au focus clavier. */
export function MonthlyBars({ cents, year, height = 180, width = 600 }: { cents: number[]; year: number; height?: number; width?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const euros = cents.map((c) => c / 100);
  const max = niceMax(Math.max(...euros));
  const ticks = [0, max / 2, max];
  const W = width;
  const H = height;
  const left = 40;
  const bottom = 22;
  const plotH = H - bottom - 8;
  const slot = (W - left) / 12;
  const barW = Math.min(24, slot - 8);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Dépenses mensuelles ${year}`}>
        {ticks.map((t) => {
          const y = 8 + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={left} x2={W} y1={y} y2={y} stroke="#2c3036" strokeWidth={1} />
              <text x={left - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#9198a1">
                {compact.format(t)}
              </text>
            </g>
          );
        })}
        {euros.map((v, i) => {
          const h = Math.max(v > 0 ? 2 : 0, (v / max) * plotH);
          const x = left + i * slot + (slot - barW) / 2;
          const y = 8 + plotH - h;
          const r = Math.min(4, h);
          return (
            <g key={i}>
              <rect
                x={left + i * slot}
                y={8}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${MONTHS_LONG[i]} ${year} : ${eur.format(v)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none"
              />
              {h > 0 && (
                <path
                  d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                  fill={active === i ? "#ef3a2f" : "#d9261c"}
                  opacity={active === null || active === i ? 1 : 0.55}
                  pointerEvents="none"
                />
              )}
              <text x={left + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={active === i ? "#eceef0" : "#9198a1"} pointerEvents="none">
                {MONTHS[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line-strong bg-surface-3 px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: `${((left + active * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="text-muted">
            {MONTHS_LONG[active]} {year}
          </p>
          <p className="font-semibold tabular-nums text-ink">{eur.format(euros[active])}</p>
        </div>
      )}
    </div>
  );
}
