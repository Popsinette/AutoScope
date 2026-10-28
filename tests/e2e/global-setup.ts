import { execSync } from "node:child_process";

/** Base de démonstration à jour (fiches composants, modèle 3D procédural, catalogue). */
export default function setup() {
  execSync("npx prisma migrate deploy && npx prisma db seed", { stdio: "inherit" });
}
