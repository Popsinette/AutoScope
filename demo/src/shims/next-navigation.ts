import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router";

/** Remplace next/navigation dans la démo (sous-ensemble utilisé par les composants partagés). */
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string, _opts?: { scroll?: boolean }) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      // Les données locales déclenchent elles-mêmes le nouveau rendu.
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  return useRouterSearchParams()[0];
}
