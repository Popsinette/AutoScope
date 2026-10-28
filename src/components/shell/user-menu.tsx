"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/connexion");
        router.refresh();
      }}
      className="flex h-9 items-center gap-2 rounded-[10px] px-3 text-[0.82rem] text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <LogOut size={16} aria-hidden />
      <span className={compact ? "sr-only" : undefined}>{pending ? "Déconnexion…" : "Se déconnecter"}</span>
    </button>
  );
}
