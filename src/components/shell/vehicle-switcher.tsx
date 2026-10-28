"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function VehicleSwitcher({
  vehicles,
  selectedId,
  select,
}: {
  vehicles: { id: string; label: string }[];
  selectedId: string | null;
  select: (vehicleId: string) => Promise<unknown>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  if (vehicles.length === 0) return null;
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="sr-only">Véhicule sélectionné</span>
      <select
        className="field h-9 max-w-[15rem] truncate py-1 text-[0.82rem]"
        value={selectedId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          start(async () => {
            await select(id);
            const next = new URLSearchParams(params);
            next.delete("v");
            router.replace(next.size ? `${pathname}?${next}` : pathname);
            router.refresh();
          });
        }}
      >
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  );
}
