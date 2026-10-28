export const vehicleLabel = (v: { make: string; model: string; trim?: string | null }) =>
  [v.make, v.model, v.trim].filter(Boolean).join(" ");
