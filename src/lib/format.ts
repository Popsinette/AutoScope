const TZ = "Europe/Paris";

const euroFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRoundFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const intFmt = new Intl.NumberFormat("fr-FR");
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const shortDateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });

export const formatEuros = (cents: number) => euroFmt.format(cents / 100);
export const formatEurosRounded = (cents: number) => euroRoundFmt.format(Math.round(cents / 100));
export const formatKm = (km: number) => `${intFmt.format(km)} km`;
export const formatNumber = (n: number) => intFmt.format(n);
export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatShortDate = (d: Date | string) => shortDateFmt.format(new Date(d));

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${intFmt.format(Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/** Valeur pour un <input type="date"> (AAAA-MM-JJ). */
export function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/** Convertit une saisie en euros (« 1 234,50 » ou « 1234.5 ») en centimes. */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.replace(/\s| |€/g, "").replace(",", ".");
  if (normalized === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

export const centsToInput = (cents: number) => (cents === 0 ? "" : (cents / 100).toFixed(2).replace(".", ","));

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(n)} ${n > 1 ? plural : singular}`;
}
