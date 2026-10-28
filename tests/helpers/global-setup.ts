import { execSync } from "node:child_process";

/** Applique les migrations (non destructif) sur la base de test dédiée. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://carview:carview@localhost:5432/carview_test";
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
