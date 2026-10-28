export type SearchParams = Record<string, string | string[] | undefined>;

export const param = (sp: SearchParams, key: string) => {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
};

/** Construit une URL en conservant/écrasant des paramètres. */
export function withParams(path: string, base: Record<string, string | undefined | null>, patch: Record<string, string | undefined | null> = {}) {
  const merged = { ...base, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function isEnumValue<T extends string>(labels: Record<T, string>, value: string | undefined): value is T {
  return !!value && Object.prototype.hasOwnProperty.call(labels, value);
}
